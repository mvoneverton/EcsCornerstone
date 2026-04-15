import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';
import { scoreAssessment, ScoringError } from '../scoring';
import { generateReport } from '../reports';
import type { AssessmentResponse, AssessmentType } from '../types';
import { PCA_GROUP_COUNT, WSA_JA_QUESTION_COUNT } from '../scoring/constants';
import { pcaResponseSchema, wsaJaResponseSchema } from './schemas';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InvitationRow {
  id: string;
  company_id: string;
  company_name: string;
  respondent_id: string;
  assessment_type: AssessmentType;
  expires_at: Date;
  opened_at: Date | null;
  completed_at: Date | null;
  position_id: string | null;
  first_name: string;
  last_name: string;
  position_title: string | null;
}

// ── Shared token lookup ───────────────────────────────────────────────────────

async function findActiveInvitation(token: string): Promise<InvitationRow | null> {
  const { rows } = await pool.query<InvitationRow>(
    `SELECT
       ai.id,
       ai.company_id,
       c.name AS company_name,
       ai.respondent_id,
       ai.assessment_type,
       ai.expires_at,
       ai.opened_at,
       ai.completed_at,
       ai.position_id,
       u.first_name,
       u.last_name,
       p.title AS position_title
     FROM assessment_invitations ai
     JOIN users u ON u.id = ai.respondent_id
     JOIN companies c ON c.id = ai.company_id
     LEFT JOIN positions p ON p.id = ai.position_id
     WHERE ai.token = $1`,
    [token]
  );
  return rows[0] ?? null;
}

function totalQuestions(type: AssessmentType): number {
  return type === 'pca' ? PCA_GROUP_COUNT : WSA_JA_QUESTION_COUNT;
}

// ── GET /api/assess/:token ────────────────────────────────────────────────────
// Public — no auth required. Validates the token and returns metadata + any
// already-saved responses so the frontend can restore in-progress state.

export async function getAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const inv = await findActiveInvitation(token);

    if (!inv) {
      res.status(404).json({ error: { message: 'Assessment not found', code: 'NOT_FOUND' } });
      return;
    }

    if (new Date(inv.expires_at) < new Date()) {
      res.status(410).json({ error: { message: 'This assessment link has expired', code: 'EXPIRED' } });
      return;
    }

    if (inv.completed_at) {
      res.status(410).json({ error: { message: 'This assessment has already been submitted', code: 'ALREADY_COMPLETED' } });
      return;
    }

    // Record first open
    if (!inv.opened_at) {
      pool.query(
        `UPDATE assessment_invitations SET opened_at = now(), updated_at = now() WHERE id = $1`,
        [inv.id]
      ).catch((err) => console.error('[assess] failed to set opened_at:', err));
    }

    // Fetch already-saved responses (returned during assessment — not after submission)
    const { rows: savedResponses } = await pool.query<{
      question_number: number;
      response_value:  number | null;
      response_most:   number | null;
      response_least:  number | null;
    }>(
      `SELECT question_number, response_value, response_most, response_least
       FROM assessment_responses
       WHERE invitation_id = $1
       ORDER BY question_number`,
      [inv.id]
    );

    const total = totalQuestions(inv.assessment_type);

    res.json({
      invitationId:   inv.id,
      assessmentType: inv.assessment_type,
      expiresAt:      inv.expires_at,
      companyName:    inv.company_name,
      respondent: {
        firstName: inv.first_name,
        lastName:  inv.last_name,
      },
      position: inv.position_id
        ? { id: inv.position_id, title: inv.position_title }
        : null,
      totalQuestions: total,
      answeredCount:  savedResponses.length,
      responses: savedResponses.map((r) => ({
        questionNumber: r.question_number,
        ...(inv.assessment_type === 'pca'
          ? { responseMost: r.response_most, responseLeast: r.response_least }
          : { responseValue: r.response_value }),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/assess/:token/response ─────────────────────────────────────────
// Saves (or updates) a single question response. Respondent may re-answer any
// question before final submission.

export async function saveResponse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const inv = await findActiveInvitation(token);

    if (!inv) {
      res.status(404).json({ error: { message: 'Assessment not found', code: 'NOT_FOUND' } });
      return;
    }
    if (new Date(inv.expires_at) < new Date()) {
      res.status(410).json({ error: { message: 'Assessment link has expired', code: 'EXPIRED' } });
      return;
    }
    if (inv.completed_at) {
      res.status(410).json({ error: { message: 'Assessment already submitted', code: 'ALREADY_COMPLETED' } });
      return;
    }

    // Validate based on assessment type
    if (inv.assessment_type === 'pca') {
      const parsed = pcaResponseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: { message: 'Validation failed', details: parsed.error.flatten() } });
        return;
      }
      const { questionNumber, responseMost, responseLeast } = parsed.data;

      await pool.query(
        `INSERT INTO assessment_responses
           (invitation_id, respondent_id, assessment_type, question_number, response_most, response_least)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (invitation_id, question_number)
         DO UPDATE SET
           response_most  = EXCLUDED.response_most,
           response_least = EXCLUDED.response_least`,
        [inv.id, inv.respondent_id, inv.assessment_type, questionNumber, responseMost, responseLeast]
      );
    } else {
      const parsed = wsaJaResponseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: { message: 'Validation failed', details: parsed.error.flatten() } });
        return;
      }
      const { questionNumber, responseValue } = parsed.data;

      await pool.query(
        `INSERT INTO assessment_responses
           (invitation_id, respondent_id, assessment_type, question_number, response_value)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (invitation_id, question_number)
         DO UPDATE SET response_value = EXCLUDED.response_value`,
        [inv.id, inv.respondent_id, inv.assessment_type, questionNumber, responseValue]
      );
    }

    // Return updated progress count
    const { rows: [{ count }] } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM assessment_responses WHERE invitation_id = $1`,
      [inv.id]
    );

    res.json({
      answeredCount:  parseInt(count, 10),
      totalQuestions: totalQuestions(inv.assessment_type),
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/assess/:token/submit ────────────────────────────────────────────
// Finalises the assessment: fetches all saved responses, runs the scoring
// engine, persists results, marks the invitation complete.
// Raw responses are NOT returned — only the scored result.

export async function submitAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const inv = await findActiveInvitation(token);

    if (!inv) {
      res.status(404).json({ error: { message: 'Assessment not found', code: 'NOT_FOUND' } });
      return;
    }
    if (new Date(inv.expires_at) < new Date()) {
      res.status(410).json({ error: { message: 'Assessment link has expired', code: 'EXPIRED' } });
      return;
    }
    if (inv.completed_at) {
      res.status(410).json({ error: { message: 'Assessment already submitted', code: 'ALREADY_COMPLETED' } });
      return;
    }

    // Fetch all saved responses
    const { rows: responseRows } = await pool.query<{
      question_number: number;
      response_value:  number | null;
      response_most:   number | null;
      response_least:  number | null;
    }>(
      `SELECT question_number, response_value, response_most, response_least
       FROM assessment_responses
       WHERE invitation_id = $1
       ORDER BY question_number`,
      [inv.id]
    );

    // Map DB rows to scoring engine interface
    const responses: AssessmentResponse[] = responseRows.map((r) => ({
      questionNumber: r.question_number,
      responseValue:  r.response_value  ?? undefined,
      responseMost:   r.response_most   ?? undefined,
      responseLeast:  r.response_least  ?? undefined,
    }));

    // Run scoring engine — throws ScoringError if incomplete
    let scoringResult;
    try {
      scoringResult = scoreAssessment(inv.assessment_type, responses);
    } catch (err) {
      if (err instanceof ScoringError) {
        res.status(422).json({
          error: {
            message: err.message,
            code: 'INCOMPLETE_ASSESSMENT',
          },
        });
        return;
      }
      throw err;
    }

    // Persist results and mark complete in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const perspective of scoringResult.perspectives) {
        await client.query(
          `INSERT INTO assessment_results
             (invitation_id, respondent_id, assessment_type, perspective,
              a_percentile, r_percentile, a_score_800, r_score_800,
              primary_profile, secondary_profile,
              is_valid, validity_flags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
           ON CONFLICT (invitation_id, perspective) DO UPDATE SET
             a_percentile      = EXCLUDED.a_percentile,
             r_percentile      = EXCLUDED.r_percentile,
             a_score_800       = EXCLUDED.a_score_800,
             r_score_800       = EXCLUDED.r_score_800,
             primary_profile   = EXCLUDED.primary_profile,
             secondary_profile = EXCLUDED.secondary_profile,
             is_valid          = EXCLUDED.is_valid,
             validity_flags    = EXCLUDED.validity_flags`,
          [
            inv.id,
            inv.respondent_id,
            inv.assessment_type,
            perspective.perspective,
            perspective.aPercentile,
            perspective.rPercentile,
            perspective.aScore800,
            perspective.rScore800,
            perspective.primaryProfile,
            perspective.secondaryProfile,
            scoringResult.isValid,
            JSON.stringify(scoringResult.validityFlags),
          ]
        );
      }

      await client.query(
        `UPDATE assessment_invitations
         SET completed_at = now(), updated_at = now()
         WHERE id = $1`,
        [inv.id]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Trigger PDF generation asynchronously — does not affect submission response
    generateReport(inv.id).catch((err) =>
      console.error(`[reports] generation failed for ${inv.id}:`, err)
    );

    // Return scored results — raw responses are never returned post-submission
    res.json({
      invitationId:  inv.id,
      assessmentType: inv.assessment_type,
      isValid:       scoringResult.isValid,
      validityFlags: scoringResult.validityFlags,
      results: scoringResult.perspectives.map((p) => ({
        perspective:      p.perspective,
        aPercentile:      p.aPercentile,
        rPercentile:      p.rPercentile,
        aScore800:        p.aScore800,
        rScore800:        p.rScore800,
        primaryProfile:   p.primaryProfile,
        secondaryProfile: p.secondaryProfile,
      })),
    });
  } catch (err) {
    next(err);
  }
}
