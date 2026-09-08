import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';

function companyId(req: Request): string {
  if (!req.user?.companyId) throw Object.assign(new Error('Company context required'), { statusCode: 403 });
  return req.user.companyId;
}

// ── GET /api/admin/dashboard ───────────────────────────────────────────────────

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid = companyId(req);

    const [
      { rows: [company] },
      { rows: [invitationStats] },
      { rows: profileBreakdown },
      { rows: recentResults },
      { rows: positions },
    ] = await Promise.all([
      pool.query<{
        name: string; plan_name: string | null; subscription_status: string;
        assessment_limit_monthly: number | null;
      }>(
        `SELECT c.name, p.name AS plan_name, c.subscription_status, p.assessment_limit_monthly
         FROM companies c LEFT JOIN plans p ON p.id = c.plan_id
         WHERE c.id = $1 AND c.deleted_at IS NULL`,
        [cid]
      ),
      pool.query<{ total: string; completed: string; pending: string }>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed,
           COUNT(*) FILTER (WHERE completed_at IS NULL AND expires_at > now()) AS pending
         FROM assessment_invitations WHERE company_id = $1`,
        [cid]
      ),
      pool.query<{ primary_profile: string; count: string }>(
        `SELECT ar.primary_profile, COUNT(*) AS count
         FROM assessment_results ar
         WHERE ar.company_id = $1 AND ar.is_valid = true
         GROUP BY ar.primary_profile`,
        [cid]
      ),
      pool.query<{
        result_id: string; first_name: string; last_name: string; email: string;
        position_title: string | null; primary_profile: string; completed_at: Date;
        report_s3_key: string | null;
      }>(
        `SELECT ar.id AS result_id, u.first_name, u.last_name, u.email,
                p.title AS position_title, ar.primary_profile, ai.completed_at, ar.report_s3_key
         FROM assessment_results ar
         JOIN assessment_invitations ai ON ai.id = ar.invitation_id
         JOIN users u ON u.id = ar.respondent_id
         LEFT JOIN positions p ON p.id = ai.position_id
         WHERE ar.company_id = $1 AND ai.completed_at IS NOT NULL AND ar.is_valid = true
         ORDER BY ai.completed_at DESC LIMIT 10`,
        [cid]
      ),
      pool.query<{
        id: string; title: string; pending_count: string;
      }>(
        `SELECT p.id, p.title,
                COUNT(ai.id) FILTER (WHERE ai.completed_at IS NULL AND ai.expires_at > now()) AS pending_count
         FROM positions p
         LEFT JOIN assessment_invitations ai ON ai.position_id = p.id
         WHERE p.company_id = $1 AND p.archived_at IS NULL
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        [cid]
      ),
    ]);

    const assessmentsUsedRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM assessment_invitations
       WHERE company_id = $1 AND created_at >= date_trunc('month', now())`,
      [cid]
    );
    const assessmentsUsed = parseInt(assessmentsUsedRes.rows[0]?.count ?? '0', 10);

    const total     = parseInt(invitationStats?.total     ?? '0', 10);
    const completed = parseInt(invitationStats?.completed ?? '0', 10);
    const pending   = parseInt(invitationStats?.pending   ?? '0', 10);

    res.json({
      company: {
        name:                company?.name ?? null,
        plan:                company?.plan_name ?? null,
        subscriptionStatus:  company?.subscription_status ?? null,
        assessmentsUsed,
        assessmentLimit:     company?.assessment_limit_monthly ?? null,
      },
      stats: {
        totalInvitations:     total,
        completedAssessments: completed,
        pendingInvitations:   pending,
        completionRate:       total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
        profileBreakdown: profileBreakdown.map((p) => ({
          profile: p.primary_profile,
          count:   parseInt(p.count, 10),
        })),
      },
      recentResults: recentResults.map((r) => ({
        id:              r.result_id,
        respondentName:  `${r.first_name} ${r.last_name}`,
        respondentEmail: r.email,
        positionTitle:   r.position_title,
        primaryProfile:  r.primary_profile,
        completedAt:     r.completed_at,
        hasReport:       r.report_s3_key !== null,
      })),
      activePositions: positions.map((p) => ({
        id:            p.id,
        title:         p.title,
        pendingCount:  parseInt(p.pending_count, 10),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/results/:resultId ───────────────────────────────────────────

export async function getResultDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cid      = companyId(req);
    const resultId = req.params['resultId'];

    const { rows: [target] } = await pool.query<{
      invitation_id: string; primary_profile: string; secondary_profile: string | null; report_s3_key: string | null;
    }>(
      `SELECT invitation_id, primary_profile, secondary_profile, report_s3_key
       FROM assessment_results WHERE id = $1 AND company_id = $2`,
      [resultId, cid]
    );

    if (!target) {
      res.status(404).json({ error: { message: 'Result not found', code: 'NOT_FOUND' } });
      return;
    }

    const [{ rows: [invitation] }, { rows: perspectives }] = await Promise.all([
      pool.query<{
        assessment_type: string; completed_at: Date;
        first_name: string; last_name: string; email: string;
        position_id: string | null; position_title: string | null;
      }>(
        `SELECT ai.assessment_type, ai.completed_at, u.first_name, u.last_name, u.email,
                p.id AS position_id, p.title AS position_title
         FROM assessment_invitations ai
         JOIN users u ON u.id = ai.respondent_id
         LEFT JOIN positions p ON p.id = ai.position_id
         WHERE ai.id = $1`,
        [target.invitation_id]
      ),
      pool.query<{
        perspective: string; a_percentile: number; r_percentile: number;
        a_score_800: number; r_score_800: number; primary_profile: string;
        secondary_profile: string | null; is_valid: boolean; validity_flags: string[];
      }>(
        `SELECT perspective, a_percentile, r_percentile, a_score_800, r_score_800,
                primary_profile, secondary_profile, is_valid, validity_flags
         FROM assessment_results WHERE invitation_id = $1
         ORDER BY CASE perspective
           WHEN 'work' THEN 1 WHEN 'self' THEN 2 WHEN 'others' THEN 3 WHEN 'single' THEN 4 ELSE 5 END`,
        [target.invitation_id]
      ),
    ]);

    res.json({
      respondent: {
        firstName: invitation!.first_name,
        lastName:  invitation!.last_name,
        email:     invitation!.email,
      },
      position: invitation!.position_id
        ? { id: invitation!.position_id, title: invitation!.position_title }
        : null,
      assessmentType:   invitation!.assessment_type,
      completedAt:      invitation!.completed_at,
      primaryProfile:   target.primary_profile,
      secondaryProfile: target.secondary_profile,
      perspectives: perspectives.map((p) => ({
        perspective:      p.perspective,
        aPercentile:      p.a_percentile,
        rPercentile:      p.r_percentile,
        aScore800:        p.a_score_800,
        rScore800:        p.r_score_800,
        primaryProfile:   p.primary_profile,
        secondaryProfile: p.secondary_profile,
        isValid:          p.is_valid,
        validityFlags:    p.validity_flags,
      })),
      hasReport:    target.report_s3_key !== null,
      reportUrlEndpoint: `/api/reports/${resultId}/url`,
    });
  } catch (err) {
    next(err);
  }
}
