import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';
import { scoreAssessment, ScoringError } from '../scoring';
import type { AssessmentResponse } from '../types';
import { mapToPFProfile, pfProfileDisplayName } from './profileMapping';
import { pfProfileTextMap } from './pfProfileTextMap';
import { sendPFResultsEmail } from '../lib/email';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function updatePFResultsEmailSent(resultId: string): Promise<void> {
  await pool.query(
    `UPDATE pf_results SET results_email_sent = true, results_email_sent_at = NOW() WHERE id = $1`,
    [resultId]
  );
}

async function findInvitationByToken(token: string): Promise<{
  id: string; event_id: string; email: string; first_name: string | null;
  last_name: string | null; status: string; event_name: string;
  event_date: Date | null; is_free: boolean;
} | null> {
  const { rows: [row] } = await pool.query<{
    id: string; event_id: string; email: string; first_name: string | null;
    last_name: string | null; status: string; event_name: string;
    event_date: Date | null; is_free: boolean;
  }>(
    `SELECT
       i.id, i.event_id, i.email, i.first_name, i.last_name, i.status,
       e.name AS event_name, e.event_date, e.is_free
     FROM pf_invitations i
     JOIN pf_events e ON e.id = i.event_id
     WHERE i.token = $1`,
    [token]
  );
  return row ?? null;
}

// ── GET /api/pf/assess/:token ─────────────────────────────────────────────────

export async function getInvitation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const inv = await findInvitationByToken(token);

    if (!inv) {
      res.status(404).json({ error: 'invalid_token' });
      return;
    }

    if (inv.status === 'completed') {
      res.status(410).json({
        error: 'already_completed',
        message: 'You have already completed this assessment. Check your email for your results.',
      });
      return;
    }

    const { rows: savedRows } = await pool.query<{
      instrument_type: string; responses: unknown;
    }>(
      `SELECT instrument_type, responses
       FROM pf_responses
       WHERE invitation_id = $1`,
      [inv.id]
    );

    const pcaRow = savedRows.find((r) => r.instrument_type === 'pca');
    const wsaRow = savedRows.find((r) => r.instrument_type === 'wsa');

    res.json({
      invitationId:   inv.id,
      firstName:      inv.first_name,
      email:          inv.email,
      eventName:      inv.event_name,
      eventDate:      inv.event_date,
      isFree:         inv.is_free,
      status:         inv.status,
      existingResponses: {
        pca: pcaRow ? (pcaRow.responses as unknown[]) : null,
        wsa: wsaRow ? (wsaRow.responses as unknown[]) : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/pf/assess/:token/save ──────────────────────────────────────────

export async function saveResponses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const { instrumentType, responses, isPartial } = req.body as {
      instrumentType: 'pca' | 'wsa';
      responses: unknown[];
      isPartial: boolean;
    };

    if (!['pca', 'wsa'].includes(instrumentType)) {
      res.status(400).json({ error: 'invalid_instrument_type' });
      return;
    }

    const inv = await findInvitationByToken(token);
    if (!inv) {
      res.status(404).json({ error: 'invalid_token' });
      return;
    }

    if (inv.status === 'completed') {
      res.status(409).json({ error: 'already_completed' });
      return;
    }

    if (inv.status === 'pending') {
      await pool.query(
        `UPDATE pf_invitations SET status = 'in_progress' WHERE id = $1`,
        [inv.id]
      );
    }

    await pool.query(
      `INSERT INTO pf_responses (invitation_id, event_id, instrument_type, responses, is_partial)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (invitation_id, instrument_type)
       DO UPDATE SET
         responses  = EXCLUDED.responses,
         is_partial = EXCLUDED.is_partial,
         saved_at   = NOW()`,
      [inv.id, inv.event_id, instrumentType, JSON.stringify(responses), isPartial ?? true]
    );

    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/pf/assess/:token/submit ────────────────────────────────────────

export async function submitAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const inv = await findInvitationByToken(token);

    if (!inv) {
      res.status(404).json({ error: 'invalid_token' });
      return;
    }

    if (inv.status === 'completed') {
      res.status(409).json({ error: 'already_completed' });
      return;
    }

    // Load both response sets
    const { rows: savedRows } = await pool.query<{
      instrument_type: string; responses: AssessmentResponse[];
    }>(
      `SELECT instrument_type, responses
       FROM pf_responses WHERE invitation_id = $1`,
      [inv.id]
    );

    const pcaRow = savedRows.find((r) => r.instrument_type === 'pca');
    const wsaRow = savedRows.find((r) => r.instrument_type === 'wsa');

    const missing: string[] = [];
    if (!pcaRow) missing.push('pca');
    if (!wsaRow) missing.push('wsa');
    if (missing.length > 0) {
      res.status(422).json({ error: 'incomplete_assessment', missing });
      return;
    }

    // Score both instruments
    let pcaResult: ReturnType<typeof scoreAssessment>;
    let wsaResult: ReturnType<typeof scoreAssessment>;

    try {
      pcaResult = scoreAssessment('pca', pcaRow!.responses);
    } catch (err) {
      if (err instanceof ScoringError) {
        res.status(422).json({ error: 'incomplete_assessment', missing: ['pca'], detail: err.message });
        return;
      }
      throw err;
    }

    try {
      wsaResult = scoreAssessment('wsa', wsaRow!.responses);
    } catch (err) {
      if (err instanceof ScoringError) {
        res.status(422).json({ error: 'incomplete_assessment', missing: ['wsa'], detail: err.message });
        return;
      }
      throw err;
    }

    // Map perspectives — PCA: [self, others, work]
    const selfP   = pcaResult.perspectives.find((p) => p.perspective === 'self')!;
    const othersP = pcaResult.perspectives.find((p) => p.perspective === 'others')!;
    const workP   = pcaResult.perspectives.find((p) => p.perspective === 'work')!;

    // Primary profile comes from PCA self perspective
    const mappedPrimary   = mapToPFProfile(selfP.primaryProfile);
    const mappedSecondary = selfP.secondaryProfile ? mapToPFProfile(selfP.secondaryProfile) : null;

    // Persist in transaction
    const client = await pool.connect();
    let resultId: string;
    try {
      await client.query('BEGIN');

      const { rows: [inserted] } = await client.query<{ id: string }>(
        `INSERT INTO pf_results (
           invitation_id, event_id,
           primary_profile, secondary_profile,
           assertiveness_score, responsiveness_score,
           assertiveness_percentile, responsiveness_percentile,
           self_perspective, work_perspective, others_perspective,
           validity_flags, raw_scoring_result
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb)
         RETURNING id`,
        [
          inv.id,
          inv.event_id,
          mappedPrimary,
          mappedSecondary,
          selfP.aScore800,
          selfP.rScore800,
          selfP.aPercentile,
          selfP.rPercentile,
          JSON.stringify(selfP),
          JSON.stringify(workP),
          JSON.stringify(othersP),
          JSON.stringify(pcaResult.validityFlags),
          JSON.stringify({ pca: pcaResult, wsa: wsaResult }),
        ]
      );

      resultId = inserted.id;

      await client.query(
        `UPDATE pf_invitations
         SET status = 'completed', completed_at = NOW(), result_id = $1
         WHERE id = $2`,
        [resultId, inv.id]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Fire results email asynchronously — do not await
    sendPFResultsEmail(
      inv.email,
      inv.first_name ?? inv.email,
      mappedPrimary,
      inv.event_name
    )
      .then(() => updatePFResultsEmailSent(resultId))
      .catch((err: unknown) => console.error('[pf] results email failed:', err));

    const profileText = pfProfileTextMap[mappedPrimary];

    res.json({
      primaryProfile:    mappedPrimary,
      profileDisplayName: pfProfileDisplayName[mappedPrimary],
      tagline:           profileText.tagline,
      message:           'Your results are on their way to your inbox.',
    });
  } catch (err) {
    next(err);
  }
}
