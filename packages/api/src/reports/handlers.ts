import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';
import { getReportSignedUrl } from './index';

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
