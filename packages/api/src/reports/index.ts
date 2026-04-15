import pool from '../db/client';
import { buildReportHtml, type ReportData, type ReportPerspective } from './template';
import { renderPdf } from './generator';
import { uploadReport, getReportUrl } from './s3';

/**
 * Full pipeline: fetch data → render HTML → generate PDF → upload to S3 → update DB.
 *
 * Called asynchronously after a successful submission — errors are logged but
 * do not affect the respondent's submission response.
 *
 * @param invitationId  The completed assessment_invitation id
 */
export async function generateReport(invitationId: string): Promise<void> {
  // ── 1. Fetch all data needed by the template ──────────────────────────────
  const { rows: [inv] } = await pool.query<{
    id:              string;
    company_id:      string;
    assessment_type: 'pca' | 'wsa' | 'ja';
    completed_at:    Date;
    position_id:     string | null;
    respondent_id:   string;
  }>(
    `SELECT id, company_id, assessment_type, completed_at, position_id, respondent_id
     FROM assessment_invitations
     WHERE id = $1`,
    [invitationId]
  );

  if (!inv) throw new Error(`Invitation ${invitationId} not found`);

  const [{ rows: [respondent] }, { rows: [company] }, { rows: results }] = await Promise.all([
    pool.query<{
      first_name:       string;
      last_name:        string;
      email:            string;
      current_position: string | null;
    }>(
      `SELECT first_name, last_name, email, current_position
       FROM users WHERE id = $1`,
      [inv.respondent_id]
    ),
    pool.query<{ name: string; logo_url: string | null }>(
      `SELECT name, logo_url FROM companies WHERE id = $1`,
      [inv.company_id]
    ),
    pool.query<{
      perspective:      string;
      a_percentile:     number;
      r_percentile:     number;
      a_score_800:      number;
      r_score_800:      number;
      primary_profile:  string;
      secondary_profile: string | null;
    }>(
      `SELECT perspective, a_percentile, r_percentile, a_score_800, r_score_800,
              primary_profile, secondary_profile
       FROM assessment_results
       WHERE invitation_id = $1
       ORDER BY CASE perspective
         WHEN 'work'   THEN 1
         WHEN 'self'   THEN 2
         WHEN 'others' THEN 3
         WHEN 'single' THEN 4
         ELSE 5
       END`,
      [invitationId]
    ),
  ]);

  if (!respondent || !company || results.length === 0) {
    throw new Error(`Incomplete data for report generation — invitation ${invitationId}`);
  }

  // Fetch position if this is a JA
  let positionData: ReportData['position'] | undefined;
  if (inv.position_id) {
    const { rows: [pos] } = await pool.query<{
      title:                   string;
      consensus_a_percentile:  number | null;
      consensus_r_percentile:  number | null;
    }>(
      `SELECT title, consensus_a_percentile, consensus_r_percentile
       FROM positions WHERE id = $1`,
      [inv.position_id]
    );
    if (pos) {
      positionData = {
        title:                pos.title,
        consensusAPercentile: pos.consensus_a_percentile,
        consensusRPercentile: pos.consensus_r_percentile,
      };
    }
  }

  // ── 2. Build template data ────────────────────────────────────────────────
  const reportData: ReportData = {
    respondent: {
      firstName:       respondent.first_name,
      lastName:        respondent.last_name,
      email:           respondent.email,
      currentPosition: respondent.current_position,
    },
    company: {
      name:    company.name,
      logoUrl: company.logo_url,
    },
    assessmentType: inv.assessment_type,
    completedAt:    inv.completed_at.toISOString(),
    perspectives: results.map((r) => ({
      perspective:      r.perspective as ReportPerspective['perspective'],
      aPercentile:      Number(r.a_percentile),
      rPercentile:      Number(r.r_percentile),
      aScore800:        Number(r.a_score_800),
      rScore800:        Number(r.r_score_800),
      primaryProfile:   r.primary_profile as ReportPerspective['primaryProfile'],
      secondaryProfile: r.secondary_profile as ReportPerspective['secondaryProfile'],
    })),
    isValid:        true,   // validity stored per-result; use primary perspective
    validityFlags:  [],
    position:       positionData,
  };

  // Pull validity from the first result row (all rows share the same flags)
  const { rows: [firstResult] } = await pool.query<{
    is_valid:      boolean;
    validity_flags: string[];
  }>(
    `SELECT is_valid, validity_flags FROM assessment_results WHERE invitation_id = $1 LIMIT 1`,
    [invitationId]
  );
  if (firstResult) {
    reportData.isValid       = firstResult.is_valid;
    reportData.validityFlags = firstResult.validity_flags ?? [];
  }

  // ── 3. Render HTML → PDF ──────────────────────────────────────────────────
  const html      = buildReportHtml(reportData);
  const pdfBuffer = await renderPdf(html);

  // ── 4. Upload to S3 ───────────────────────────────────────────────────────
  const s3Key = await uploadReport(inv.company_id, invitationId, pdfBuffer);

  // ── 5. Persist S3 key on all result rows for this invitation ──────────────
  await pool.query(
    `UPDATE assessment_results SET report_s3_key = $1 WHERE invitation_id = $2`,
    [s3Key, invitationId]
  );

  console.log(`[reports] ✓ generated ${s3Key}`);
}

/**
 * Returns a pre-signed S3 URL for a completed report.
 * Throws if the report has not been generated yet.
 */
export async function getReportSignedUrl(
  invitationId: string,
  companyId:    string
): Promise<string> {
  const { rows: [result] } = await pool.query<{ report_s3_key: string | null }>(
    `SELECT ar.report_s3_key
     FROM assessment_results ar
     JOIN assessment_invitations ai ON ai.id = ar.invitation_id
     WHERE ar.invitation_id = $1
       AND ai.company_id    = $2
       AND ar.report_s3_key IS NOT NULL
     LIMIT 1`,
    [invitationId, companyId]
  );

  if (!result?.report_s3_key) {
    throw Object.assign(
      new Error('Report not yet generated for this assessment'),
      { statusCode: 404, code: 'REPORT_NOT_READY' }
    );
  }

  return getReportUrl(result.report_s3_key);
}
