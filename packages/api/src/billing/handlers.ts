import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';
import stripe from './stripe';
import type { JwtPayload } from '../types';

// ── GET /api/billing/subscription ────────────────────────────────────────────

export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as JwtPayload;
    if (!user.companyId) {
      res.status(403).json({ error: { message: 'No company associated with this account' } });
      return;
    }

    const { rows: [row] } = await pool.query<{
      subscription_status:   string;
      current_period_end:    Date | null;
      trial_ends_at:         Date | null;
      stripe_customer_id:    string | null;
      plan_name:             string;
      plan_assessment_limit:   number | null;
      price_monthly_cents:     number | null;
    }>(
      `SELECT c.subscription_status, c.current_period_end, c.trial_ends_at,
              c.stripe_customer_id,
              p.name AS plan_name, p.assessment_limit_monthly AS plan_assessment_limit,
              p.price_monthly_cents
       FROM companies c
       JOIN plans p ON p.id = c.plan_id
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [user.companyId]
    );

    if (!row) {
      res.status(404).json({ error: { message: 'Company not found' } });
      return;
    }

    // Usage this month
    const { rows: [usage] } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM assessment_invitations
       WHERE company_id = $1
         AND created_at >= date_trunc('month', now())`,
      [user.companyId]
    );

    res.json({
      subscriptionStatus: row.subscription_status,
      currentPeriodEnd:   row.current_period_end,
      trialEndsAt:        row.trial_ends_at,
      usageThisMonth:     parseInt(usage?.count ?? '0', 10),
      plan: {
        name:             row.plan_name,
        assessmentLimit:  row.plan_assessment_limit,
        priceMonthly:     row.price_monthly_cents,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/billing/portal ──────────────────────────────────────────────────

export async function createPortalSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as JwtPayload;
    if (!user.companyId) {
      res.status(403).json({ error: { message: 'No company associated with this account' } });
      return;
    }

    const { rows: [company] } = await pool.query<{ stripe_customer_id: string | null }>(
      `SELECT stripe_customer_id FROM companies WHERE id = $1 AND deleted_at IS NULL`,
      [user.companyId]
    );

    if (!company?.stripe_customer_id) {
      res.status(400).json({ error: { message: 'No billing account found. Please contact support.', code: 'NO_STRIPE_CUSTOMER' } });
      return;
    }

    const returnUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/settings/billing`
      : 'http://localhost:3000/settings/billing';

    const session = await stripe.billingPortal.sessions.create({
      customer:   company.stripe_customer_id,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
}
