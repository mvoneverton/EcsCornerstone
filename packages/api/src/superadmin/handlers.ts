import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import sgMail from '@sendgrid/mail';
import pool from '../db/client';
import { hashToken } from '../middleware/clientPathToken';
import { signImpersonationToken } from '../auth/jwt';
import { logAudit } from './auditLog';
import { updatePlanSchema, updateSubscriptionStatusSchema, gatedPathSchema } from './schemas';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const PATH_LABELS: Record<'agent_placement' | 'fcaio', string> = {
  agent_placement: 'Agent Placement',
  fcaio:           'FCAIO',
};

// ── Shared helpers ─────────────────────────────────────────────────────────────

async function findCompanyAdmin(companyId: string): Promise<{
  id: string; email: string; first_name: string; last_name: string;
} | null> {
  const { rows: [admin] } = await pool.query<{
    id: string; email: string; first_name: string; last_name: string;
  }>(
    `SELECT id, email, first_name, last_name FROM users
     WHERE company_id = $1 AND role = 'company_admin' AND deleted_at IS NULL
     ORDER BY created_at ASC LIMIT 1`,
    [companyId]
  );
  return admin ?? null;
}

// ── GET /api/superadmin/companies ─────────────────────────────────────────────

export async function listCompanies(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rows } = await pool.query<{
      id: string;
      name: string;
      subscription_status: string;
      plan_name: string | null;
      current_period_end: Date | null;
      stripe_customer_id: string | null;
      created_at: Date;
      admin_email: string | null;
      admin_name: string | null;
      assessment_count: string;
      active_invitations: string;
      gated_agent_placement: boolean | null;
      gated_fcaio: boolean | null;
    }>(
      `SELECT
         c.id, c.name, c.subscription_status, p.name AS plan_name,
         c.current_period_end, c.stripe_customer_id, c.created_at,
         admin.email AS admin_email,
         admin.first_name || ' ' || admin.last_name AS admin_name,
         COALESCE(ar.count, 0)  AS assessment_count,
         COALESCE(inv.count, 0) AS active_invitations,
         gated.agent_placement  AS gated_agent_placement,
         gated.fcaio            AS gated_fcaio
       FROM companies c
       LEFT JOIN plans p ON p.id = c.plan_id
       LEFT JOIN LATERAL (
         SELECT email, first_name, last_name FROM users
         WHERE company_id = c.id AND role = 'company_admin' AND deleted_at IS NULL
         ORDER BY created_at ASC LIMIT 1
       ) admin ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS count FROM assessment_results WHERE company_id = c.id
       ) ar ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS count FROM assessment_invitations
         WHERE company_id = c.id AND completed_at IS NULL AND expires_at > now()
       ) inv ON true
       LEFT JOIN LATERAL (
         SELECT
           bool_or(path_type = 'agent_placement') AS agent_placement,
           bool_or(path_type = 'fcaio')           AS fcaio
         FROM path_tokens
         WHERE company_id = c.id AND path_type IS NOT NULL
           AND deleted_at IS NULL AND expires_at > now()
       ) gated ON true
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at DESC`
    );

    res.json({
      companies: rows.map((r) => ({
        id:                 r.id,
        name:               r.name,
        subscriptionStatus: r.subscription_status,
        planName:           r.plan_name,
        currentPeriodEnd:   r.current_period_end,
        stripeCustomerId:   r.stripe_customer_id,
        adminEmail:         r.admin_email,
        adminName:          r.admin_name,
        assessmentCount:    parseInt(r.assessment_count, 10),
        activeInvitations:  parseInt(r.active_invitations, 10),
        createdAt:          r.created_at,
        gatedServices: {
          agentPlacement: r.gated_agent_placement ?? false,
          fcaio:          r.gated_fcaio ?? false,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/superadmin/companies/:companyId ──────────────────────────────────

export async function getCompanyDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;

    const { rows: [company] } = await pool.query<{
      id: string;
      name: string;
      subscription_status: string;
      plan_id: string | null;
      plan_name: string | null;
      current_period_end: Date | null;
      trial_ends_at: Date | null;
      stripe_customer_id: string | null;
      created_at: Date;
    }>(
      `SELECT c.id, c.name, c.subscription_status, c.plan_id, p.name AS plan_name,
              c.current_period_end, c.trial_ends_at, c.stripe_customer_id, c.created_at
       FROM companies c
       LEFT JOIN plans p ON p.id = c.plan_id
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [companyId]
    );

    if (!company) {
      res.status(404).json({ error: { message: 'Company not found', code: 'NOT_FOUND' } });
      return;
    }

    const [
      { rows: users },
      { rows: positions },
      { rows: recentResults },
      { rows: pathTokens },
    ] = await Promise.all([
      pool.query<{ id: string; first_name: string; last_name: string; email: string; role: string; created_at: Date }>(
        `SELECT id, first_name, last_name, email, role, created_at
         FROM users WHERE company_id = $1 AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [companyId]
      ),
      pool.query<{ id: string; title: string; created_at: Date }>(
        `SELECT id, title, created_at FROM positions
         WHERE company_id = $1 AND archived_at IS NULL
         ORDER BY created_at DESC`,
        [companyId]
      ),
      pool.query<{
        id: string; respondent_name: string; primary_profile: string; completed_at: Date;
      }>(
        `SELECT ar.id, u.first_name || ' ' || u.last_name AS respondent_name,
                ar.primary_profile, ai.completed_at
         FROM assessment_results ar
         JOIN assessment_invitations ai ON ai.id = ar.invitation_id
         JOIN users u ON u.id = ar.respondent_id
         WHERE ar.company_id = $1 AND ai.completed_at IS NOT NULL
         ORDER BY ai.completed_at DESC
         LIMIT 10`,
        [companyId]
      ),
      pool.query<{
        id: string; user_id: string | null; path_type: string | null; paths: string[] | null;
        expires_at: Date; used_at: Date | null; deleted_at: Date | null; created_at: Date;
      }>(
        `SELECT id, user_id, path_type, paths, expires_at, used_at, deleted_at, created_at
         FROM path_tokens WHERE company_id = $1
         ORDER BY created_at DESC`,
        [companyId]
      ),
    ]);

    const { rows: auditLog } = await pool.query<{
      id: string; action: string; old_value: unknown; new_value: unknown;
      performed_by: string; created_at: Date;
    }>(
      `SELECT l.id, l.action, l.old_value, l.new_value,
              u.first_name || ' ' || u.last_name AS performed_by, l.created_at
       FROM super_admin_audit_log l
       JOIN users u ON u.id = l.admin_user_id
       WHERE l.company_id = $1
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [companyId]
    );

    res.json({
      company: {
        id:                 company.id,
        name:               company.name,
        subscriptionStatus: company.subscription_status,
        planId:             company.plan_id,
        planName:           company.plan_name,
        currentPeriodEnd:   company.current_period_end,
        trialEndsAt:        company.trial_ends_at,
        stripeCustomerId:   company.stripe_customer_id,
        createdAt:          company.created_at,
      },
      users: users.map((u) => ({
        id: u.id, firstName: u.first_name, lastName: u.last_name,
        email: u.email, role: u.role, createdAt: u.created_at,
      })),
      positions: positions.map((p) => ({ id: p.id, title: p.title, createdAt: p.created_at })),
      recentResults: recentResults.map((r) => ({
        id: r.id, respondentName: r.respondent_name,
        primaryProfile: r.primary_profile, completedAt: r.completed_at,
      })),
      pathTokens: pathTokens.map((t) => ({
        id: t.id, userId: t.user_id, pathType: t.path_type, paths: t.paths,
        expiresAt: t.expires_at, usedAt: t.used_at, deletedAt: t.deleted_at, createdAt: t.created_at,
      })),
      auditLog: auditLog.map((l) => ({
        id: l.id, action: l.action, oldValue: l.old_value, newValue: l.new_value,
        performedBy: l.performed_by, createdAt: l.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/superadmin/companies/:companyId/plan ───────────────────────────

export async function updateCompanyPlan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;
    const body = updatePlanSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { rows: [current] } = await pool.query<{ plan_id: string | null }>(
      `SELECT plan_id FROM companies WHERE id = $1 AND deleted_at IS NULL`,
      [companyId]
    );
    if (!current) {
      res.status(404).json({ error: { message: 'Company not found', code: 'NOT_FOUND' } });
      return;
    }

    const { rows: [plan] } = await pool.query<{ id: string }>(
      `SELECT id FROM plans WHERE id = $1`,
      [body.data.planId]
    );
    if (!plan) {
      res.status(404).json({ error: { message: 'Plan not found', code: 'PLAN_NOT_FOUND' } });
      return;
    }

    await pool.query(
      `UPDATE companies SET plan_id = $1, updated_at = now() WHERE id = $2`,
      [body.data.planId, companyId]
    );

    await logAudit({
      adminUserId: req.user!.sub,
      companyId,
      action:   'company.plan_changed',
      oldValue: { planId: current.plan_id },
      newValue: { planId: body.data.planId },
      ipAddress: req.ip ?? null,
    });

    res.json({ message: 'Plan updated' });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/superadmin/companies/:companyId/subscription-status ───────────

export async function updateCompanySubscriptionStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;
    const body = updateSubscriptionStatusSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { rows: [current] } = await pool.query<{ subscription_status: string }>(
      `SELECT subscription_status FROM companies WHERE id = $1 AND deleted_at IS NULL`,
      [companyId]
    );
    if (!current) {
      res.status(404).json({ error: { message: 'Company not found', code: 'NOT_FOUND' } });
      return;
    }

    await pool.query(
      `UPDATE companies SET subscription_status = $1, updated_at = now() WHERE id = $2`,
      [body.data.status, companyId]
    );

    await logAudit({
      adminUserId: req.user!.sub,
      companyId,
      action:   'company.status_overridden',
      oldValue: { status: current.subscription_status },
      newValue: { status: body.data.status },
      ipAddress: req.ip ?? null,
    });

    res.json({ message: 'Subscription status updated' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/superadmin/companies/:companyId/unlock-path ────────────────────
// Company-wide gated service unlock. Separate from the per-user unlock flow
// in admin/pathHandlers.ts — this issues one token for the whole company,
// scoped by company_id with no user_id, keyed by path_type not paths[].

export async function unlockCompanyPath(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;
    const body = gatedPathSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }
    const { path } = body.data;

    const { rows: [company] } = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM companies WHERE id = $1 AND deleted_at IS NULL`,
      [companyId]
    );
    if (!company) {
      res.status(404).json({ error: { message: 'Company not found', code: 'NOT_FOUND' } });
      return;
    }

    const rawToken  = randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO path_tokens (company_id, token_hash, path_type, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [companyId, tokenHash, path, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const url = `${frontendUrl}/gated/${path}?token=${rawToken}`;

    const admin = await findCompanyAdmin(companyId);
    if (admin) {
      const label = PATH_LABELS[path];
      if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
        await sgMail.send({
          to:      admin.email,
          from:    process.env.SENDGRID_FROM_EMAIL,
          subject: `Your ECS ${label} access is ready`,
          text: [
            `Hi ${admin.first_name},`,
            '',
            `${company.name} now has access to ${label}. Use the link below to get started.`,
            '',
            url,
            '',
            'This link expires in 30 days.',
            '',
            'The ECS Team',
          ].join('\n'),
        }).catch((err: unknown) => console.error('[superadmin] gated path email failed:', err));
      } else {
        console.log(`[superadmin] ${label} unlock link for ${admin.email}: ${url}`);
      }
    } else {
      console.warn(`[superadmin] no company_admin found for company ${companyId} — unlock email not sent`);
    }

    await logAudit({
      adminUserId: req.user!.sub,
      companyId,
      action:   'path.unlocked',
      newValue: { path, expiresAt },
      ipAddress: req.ip ?? null,
    });

    res.status(201).json({
      success:      true,
      expiresAt,
      tokenPreview: `${rawToken.slice(0, 8)}...`,
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/superadmin/companies/:companyId/revoke-path ──────────────────

export async function revokeCompanyPath(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;
    const body = gatedPathSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }
    const { path } = body.data;

    const { rows } = await pool.query<{ id: string }>(
      `UPDATE path_tokens SET deleted_at = now()
       WHERE company_id = $1 AND path_type = $2 AND deleted_at IS NULL
       RETURNING id`,
      [companyId, path]
    );

    await logAudit({
      adminUserId: req.user!.sub,
      companyId,
      action:   'path.revoked',
      newValue: { path, revokedCount: rows.length },
      ipAddress: req.ip ?? null,
    });

    res.json({ message: 'Access revoked', revokedCount: rows.length });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/superadmin/analytics ─────────────────────────────────────────────

export async function getAnalytics(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      { rows: [companyCounts] },
      { rows: [assessmentCounts] },
      { rows: activePlans },
      { rows: topProfiles },
      { rows: recentSignups },
      { rows: recentCompletions },
    ] = await Promise.all([
      pool.query<{ total: string; active: string }>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE subscription_status IN ('active', 'trialing')) AS active
         FROM companies WHERE deleted_at IS NULL`
      ),
      pool.query<{ total: string; this_month: string }>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE completed_at >= date_trunc('month', now())) AS this_month
         FROM assessment_invitations WHERE completed_at IS NOT NULL`
      ),
      pool.query<{ price_monthly_cents: number }>(
        `SELECT p.price_monthly_cents FROM companies c
         JOIN plans p ON p.id = c.plan_id
         WHERE c.deleted_at IS NULL AND c.subscription_status IN ('active', 'trialing')`
      ),
      pool.query<{ primary_profile: string; count: string }>(
        `SELECT primary_profile, COUNT(*) AS count
         FROM assessment_results WHERE is_valid = true
         GROUP BY primary_profile ORDER BY count DESC`
      ),
      pool.query<{ name: string; created_at: Date }>(
        `SELECT name, created_at FROM companies
         WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5`
      ),
      pool.query<{ respondent_name: string; company_name: string; primary_profile: string; completed_at: Date }>(
        `SELECT u.first_name || ' ' || u.last_name AS respondent_name,
                c.name AS company_name, ar.primary_profile, ai.completed_at
         FROM assessment_results ar
         JOIN assessment_invitations ai ON ai.id = ar.invitation_id
         JOIN users u ON u.id = ar.respondent_id
         JOIN companies c ON c.id = ar.company_id
         WHERE ai.completed_at IS NOT NULL
         ORDER BY ai.completed_at DESC LIMIT 5`
      ),
    ]);

    // revenueThisMonth: no live Stripe charge reconciliation — approximated as
    // sum of monthly plan price across active/trialing companies.
    const revenueThisMonth = activePlans.reduce((sum, p) => sum + p.price_monthly_cents, 0);

    res.json({
      totalCompanies:            parseInt(companyCounts?.total ?? '0', 10),
      activeSubscriptions:       parseInt(companyCounts?.active ?? '0', 10),
      totalAssessmentsCompleted: parseInt(assessmentCounts?.total ?? '0', 10),
      assessmentsThisMonth:      parseInt(assessmentCounts?.this_month ?? '0', 10),
      revenueThisMonth,
      topProfiles: topProfiles.map((p) => ({ profile: p.primary_profile, count: parseInt(p.count, 10) })),
      recentSignups: recentSignups.map((c) => ({ name: c.name, createdAt: c.created_at })),
      recentCompletions: recentCompletions.map((c) => ({
        respondentName: c.respondent_name,
        companyName:    c.company_name,
        profile:        c.primary_profile,
        completedAt:    c.completed_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/superadmin/impersonate/:companyId ───────────────────────────────

export async function impersonateCompany(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { companyId } = req.params;

    const admin = await findCompanyAdmin(companyId);
    if (!admin) {
      res.status(404).json({ error: { message: 'No company_admin found for this company', code: 'NO_ADMIN' } });
      return;
    }

    const accessToken = signImpersonationToken({
      sub:            admin.id,
      email:          admin.email,
      role:           'company_admin',
      companyId,
      impersonatedBy: req.user!.sub,
    });

    await logAudit({
      adminUserId: req.user!.sub,
      companyId,
      action:   'impersonation.started',
      newValue: { impersonatedUserId: admin.id },
      ipAddress: req.ip ?? null,
    });

    res.json({
      accessToken,
      user: {
        id:        admin.id,
        companyId,
        email:     admin.email,
        role:      'company_admin',
        firstName: admin.first_name,
        lastName:  admin.last_name,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/superadmin/exit-impersonation ────────────────────────────────────
// Called while still holding the impersonation token, before the frontend
// restores the original super_admin token — so this is reachable by the
// impersonated session itself, not by requireSuperAdmin.

export async function exitImpersonation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user?.impersonatedBy) {
      await logAudit({
        adminUserId: req.user.impersonatedBy,
        companyId:   req.user.companyId,
        action:   'impersonation.ended',
        oldValue: { impersonatedUserId: req.user.sub },
        ipAddress: req.ip ?? null,
      });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/superadmin/audit-log ─────────────────────────────────────────────
// Platform-wide audit log, newest first.

export async function listAuditLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page   = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '50'), 10)));
    const offset = (page - 1) * limit;

    const [{ rows }, { rows: [countRow] }] = await Promise.all([
      pool.query<{
        id: string; action: string; old_value: unknown; new_value: unknown;
        company_name: string | null; performed_by: string; created_at: Date;
      }>(
        `SELECT l.id, l.action, l.old_value, l.new_value,
                c.name AS company_name,
                u.first_name || ' ' || u.last_name AS performed_by,
                l.created_at
         FROM super_admin_audit_log l
         JOIN users u ON u.id = l.admin_user_id
         LEFT JOIN companies c ON c.id = l.company_id
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query<{ total: string }>(`SELECT COUNT(*) AS total FROM super_admin_audit_log`),
    ]);

    const total = parseInt(countRow?.total ?? '0', 10);

    res.json({
      entries: rows.map((l) => ({
        id: l.id, action: l.action, oldValue: l.old_value, newValue: l.new_value,
        companyName: l.company_name, performedBy: l.performed_by, createdAt: l.created_at,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}
