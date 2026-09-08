import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';
import { getReportSignedUrl, generateReport } from './index';
import { getReportUrl } from './s3';

const RESULT_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * GET /api/admin/reports/:invitationId
 * Returns a 1-hour pre-signed S3 URL for a completed report PDF.
 * Company-scoped — admin/facilitator only (enforced by router middleware).
 */
export async function adminGetReportUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const companyId    = req.user?.companyId;
    const invitationId = req.params['invitationId'];

    if (!companyId) {
      res.status(403).json({ error: { message: 'Company context required', code: 'FORBIDDEN' } });
      return;
    }

    const url = await getReportSignedUrl(invitationId, companyId);
    res.json({ url, expiresInSeconds: 3600 });
  } catch (err: unknown) {
    next(err);
  }
}

/**
 * GET /api/assess/:token/report
 * Returns a pre-signed URL for the respondent to download their own report.
 * Token acts as the auth credential — no JWT required.
 */
export async function respondentGetReportUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;

    const { rows: [inv] } = await pool.query<{
      id:           string;
      company_id:   string;
      completed_at: Date | null;
    }>(
      `SELECT id, company_id, completed_at
       FROM assessment_invitations
       WHERE token = $1`,
      [token]
    );

    if (!inv) {
      res.status(404).json({ error: { message: 'Assessment not found', code: 'NOT_FOUND' } });
      return;
    }
    if (!inv.completed_at) {
      res.status(404).json({ error: { message: 'Assessment not yet completed', code: 'NOT_COMPLETED' } });
      return;
    }

    const url = await getReportSignedUrl(inv.id, inv.company_id);
    res.json({ url, expiresInSeconds: 3600 });
  } catch (err: unknown) {
    next(err);
  }
}

// ── /api/reports/:resultId/* ──────────────────────────────────────────────────
// Authenticated dashboard access to reports, keyed by assessment_results.id.
// A separate access pattern from the invitation-keyed routes above, which
// serve anonymous respondents during/immediately after submission.

/**
 * GET /api/reports/:resultId/url
 * requireAuth — company-scoped (or super_admin, any company).
 */
export async function getResultReportUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { resultId } = req.params;
    const isSuperAdmin = req.user?.role === 'super_admin';

    const { rows: [result] } = await pool.query<{ report_s3_key: string | null }>(
      isSuperAdmin
        ? `SELECT report_s3_key FROM assessment_results WHERE id = $1`
        : `SELECT report_s3_key FROM assessment_results WHERE id = $1 AND company_id = $2`,
      isSuperAdmin ? [resultId] : [resultId, req.user?.companyId]
    );

    if (!result) {
      res.status(404).json({ error: { message: 'Result not found', code: 'NOT_FOUND' } });
      return;
    }

    if (!result.report_s3_key) {
      res.status(202).json({ status: 'generating', message: 'Report is still being generated' });
      return;
    }

    const url = await getReportUrl(result.report_s3_key, RESULT_URL_EXPIRY_SECONDS);
    res.json({ url, expiresAt: new Date(Date.now() + RESULT_URL_EXPIRY_SECONDS * 1000) });
  } catch (err: unknown) {
    next(err);
  }
}

/**
 * GET /api/reports/:resultId/url/respondent?token=invitationToken
 * Token-based — no JWT. Used by the report-ready email link.
 */
export async function getResultReportUrlForRespondent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { resultId } = req.params;
    const token = req.query['token'] as string | undefined;

    if (!token) {
      res.status(400).json({ error: { message: 'Token is required', code: 'MISSING_TOKEN' } });
      return;
    }

    const { rows: [result] } = await pool.query<{ report_s3_key: string | null }>(
      `SELECT ar.report_s3_key
       FROM assessment_results ar
       JOIN assessment_invitations ai ON ai.id = ar.invitation_id
       WHERE ar.id = $1 AND ai.token = $2 AND ai.completed_at IS NOT NULL`,
      [resultId, token]
    );

    if (!result) {
      res.status(404).json({ error: { message: 'Report not found', code: 'NOT_FOUND' } });
      return;
    }

    if (!result.report_s3_key) {
      res.status(202).json({ status: 'generating', message: 'Report is still being generated' });
      return;
    }

    const url = await getReportUrl(result.report_s3_key, RESULT_URL_EXPIRY_SECONDS);
    res.json({ url, expiresAt: new Date(Date.now() + RESULT_URL_EXPIRY_SECONDS * 1000) });
  } catch (err: unknown) {
    next(err);
  }
}

/**
 * POST /api/reports/:resultId/regenerate
 * requireAuth + super_admin only (enforced by router).
 */
export async function regenerateResultReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { resultId } = req.params;

    const { rows: [result] } = await pool.query<{ invitation_id: string }>(
      `SELECT invitation_id FROM assessment_results WHERE id = $1`,
      [resultId]
    );

    if (!result) {
      res.status(404).json({ error: { message: 'Result not found', code: 'NOT_FOUND' } });
      return;
    }

    generateReport(result.invitation_id).catch((err) =>
      console.error(`[reports] regeneration failed for invitation ${result.invitation_id}:`, err)
    );

    res.status(202).json({ status: 'regenerating' });
  } catch (err: unknown) {
    next(err);
  }
}
