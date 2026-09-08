import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import pool from '../db/client';
import stripe from '../billing/stripe';
import { hashPassword } from '../auth/password';
import { registerSchema } from './schemas';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// ── GET /api/onboarding/plans ─────────────────────────────────────────────────
// Public — used by the signup page to display plan options.

export async function listPlans(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rows } = await pool.query<{
      id: string;
      name: string;
      price_monthly_cents: number;
      price_annually_cents: number;
      assessment_limit_monthly: number | null;
      features: string[];
    }>(
      `SELECT id, name, price_monthly_cents, price_annually_cents, assessment_limit_monthly, features
       FROM plans
       ORDER BY price_monthly_cents ASC`
    );

    res.json({
      plans: rows.map((p) => ({
        id:                    p.id,
        name:                  p.name,
        priceMonthlyCents:     p.price_monthly_cents,
        priceAnnuallyCents:    p.price_annually_cents,
        assessmentLimitMonthly: p.assessment_limit_monthly,
        features:              p.features,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/onboarding/register ─────────────────────────────────────────────
// Public — creates the company + admin user, then hands back a Stripe Checkout
// URL. No JWT is issued here: the account isn't active until checkout.session.completed
// fires (see billing/webhooks.ts), so there's nothing to log in to yet.

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { companyName, adminFirstName, adminLastName, email, password, planId, billingCycle } = body.data;

    // Email uniqueness
    const { rows: existing } = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: { message: 'Email already registered', code: 'EMAIL_TAKEN' } });
      return;
    }

    // Resolve plan + the Stripe price for the chosen billing cycle
    const { rows: [plan] } = await pool.query<{
      id: string;
      stripe_price_monthly: string | null;
      stripe_price_annually: string | null;
    }>(
      `SELECT id, stripe_price_monthly, stripe_price_annually FROM plans WHERE id = $1`,
      [planId]
    );
    if (!plan) {
      res.status(404).json({ error: { message: 'Plan not found', code: 'PLAN_NOT_FOUND' } });
      return;
    }

    const priceId = billingCycle === 'annually' ? plan.stripe_price_annually : plan.stripe_price_monthly;
    if (!priceId) {
      res.status(400).json({
        error: {
          message: 'This plan is not available for self-serve checkout — please contact us.',
          code: 'PLAN_NOT_SELF_SERVE',
        },
      });
      return;
    }

    // Unique slug (same scheme as auth/handlers.ts register)
    const baseSlug = toSlug(companyName);
    let slug = baseSlug;
    const { rows: slugCheck } = await pool.query<{ slug: string }>(
      `SELECT slug FROM companies WHERE slug LIKE $1 ORDER BY slug`,
      [`${baseSlug}%`]
    );
    if (slugCheck.some((r) => r.slug === slug)) {
      slug = `${baseSlug}-${randomBytes(2).toString('hex')}`;
    }

    const passwordHash = await hashPassword(password);

    const client = await pool.connect();
    let companyId: string;
    try {
      await client.query('BEGIN');

      const { rows: [company] } = await client.query<{ id: string }>(
        `INSERT INTO companies (name, slug, plan_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [companyName, slug, plan.id]
      );
      companyId = company!.id;

      await client.query(
        `INSERT INTO users
           (company_id, email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, 'company_admin', $4, $5)`,
        [companyId, email.toLowerCase(), passwordHash, adminFirstName, adminLastName]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Stripe customer + hosted Checkout session
    const customer = await stripe.customers.create({
      email: email.toLowerCase(),
      name:  companyName,
      metadata: { company_id: companyId },
    });

    await pool.query(
      `UPDATE companies SET stripe_customer_id = $1, updated_at = now() WHERE id = $2`,
      [customer.id, companyId]
    );

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode:     'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${frontendUrl}/onboarding/cancelled`,
      metadata: { companyId },
    });

    res.status(201).json({ checkoutUrl: session.url });
  } catch (err) {
    next(err);
  }
}
