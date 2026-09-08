import type Stripe from 'stripe';
import pool from '../db/client';
import stripe from './stripe';
import { sendWelcomeEmail } from '../lib/email';
import {
  companyByStripeCustomer,
  planByStripePrice,
  reportOveragesForPeriod,
} from './usage';

// ── Onboarding checkout ────────────────────────────────────────────────────────

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const companyId = session.metadata?.companyId;
  if (!companyId) {
    console.warn(`[billing] checkout.session.completed — no companyId in metadata (session ${session.id})`);
    return;
  }

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  if (!subscriptionId) {
    console.warn(`[billing] checkout.session.completed — no subscription on session ${session.id}`);
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  await pool.query(
    `UPDATE companies SET
       subscription_status    = 'active',
       stripe_subscription_id = $1,
       current_period_end     = $2,
       updated_at              = now()
     WHERE id = $3`,
    [subscriptionId, new Date(sub.current_period_end * 1000), companyId]
  );

  console.log(`[billing] checkout completed — company ${companyId} activated (subscription ${subscriptionId})`);

  // Welcome email to the new company_admin — best effort, never blocks activation.
  try {
    const { rows: [row] } = await pool.query<{
      company_name: string;
      admin_first_name: string | null;
      admin_email: string | null;
      plan_name: string | null;
      assessment_limit_monthly: number | null;
    }>(
      `SELECT c.name AS company_name,
              p.name AS plan_name,
              p.assessment_limit_monthly,
              admin.first_name AS admin_first_name,
              admin.email      AS admin_email
       FROM companies c
       LEFT JOIN plans p ON p.id = c.plan_id
       LEFT JOIN LATERAL (
         SELECT first_name, email FROM users
         WHERE company_id = c.id AND role = 'company_admin' AND deleted_at IS NULL
         ORDER BY created_at ASC LIMIT 1
       ) admin ON true
       WHERE c.id = $1`,
      [companyId]
    );

    if (row?.admin_email) {
      await sendWelcomeEmail({
        toEmail:         row.admin_email,
        adminFirstName:  row.admin_first_name ?? 'there',
        companyName:     row.company_name,
        planName:        row.plan_name ?? 'your plan',
        assessmentLimit: row.assessment_limit_monthly,
      });
    } else {
      console.warn(`[billing] no company_admin found for company ${companyId} — welcome email not sent`);
    }
  } catch (err) {
    console.error('[billing] welcome email failed', err);
  }
}

// ── Subscription lifecycle ────────────────────────────────────────────────────

export async function handleSubscriptionUpdated(
  sub: Stripe.Subscription
): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const company    = await companyByStripeCustomer(customerId);
  if (!company) {
    console.warn(`[billing] subscription.updated — no company for customer ${customerId}`);
    return;
  }

  // Resolve plan from the price on the first subscription item
  const priceId = sub.items.data[0]?.price?.id ?? null;
  let planId    = company.plan_id;
  if (priceId) {
    const plan = await planByStripePrice(priceId);
    if (plan) planId = plan.id;
  }

  await pool.query(
    `UPDATE companies SET
       stripe_subscription_id = $1,
       subscription_status    = $2,
       current_period_end     = $3,
       plan_id                = $4,
       trial_ends_at          = $5,
       updated_at             = now()
     WHERE id = $6`,
    [
      sub.id,
      sub.status,
      new Date(sub.current_period_end * 1000),
      planId,
      sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      company.id,
    ]
  );

  console.log(`[billing] subscription updated — company ${company.id} status=${sub.status}`);
}

export async function handleSubscriptionDeleted(
  sub: Stripe.Subscription
): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const company    = await companyByStripeCustomer(customerId);
  if (!company) return;

  // Downgrade to Starter on cancellation (keeps data intact)
  const { rows: [starter] } = await pool.query<{ id: string }>(
    `SELECT id FROM plans WHERE name = 'Starter' LIMIT 1`
  );

  await pool.query(
    `UPDATE companies SET
       stripe_subscription_id = NULL,
       subscription_status    = 'canceled',
       current_period_end     = $1,
       plan_id                = $2,
       updated_at             = now()
     WHERE id = $3`,
    [new Date(sub.current_period_end * 1000), starter?.id ?? company.plan_id, company.id]
  );

  console.log(`[billing] subscription canceled — company ${company.id}`);
}

// ── Invoice lifecycle ─────────────────────────────────────────────────────────

export async function handleInvoiceUpcoming(
  invoice: Stripe.Invoice
): Promise<void> {
  // invoice.upcoming fires ~1 hour before each billing period closes.
  // This is our window to add overage invoice items before the invoice is finalized.
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  if (!customerId) return;

  const company = await companyByStripeCustomer(customerId);
  if (!company) return;

  // period_start and period_end come from the subscription item on the invoice
  const sub = invoice.subscription;
  if (!sub) return;

  const periodStart = new Date((invoice.period_start ?? 0) * 1000);
  const periodEnd   = new Date((invoice.period_end   ?? 0) * 1000);

  await reportOveragesForPeriod(company.id, periodStart, periodEnd);
}

export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  if (!customerId) return;

  const company = await companyByStripeCustomer(customerId);
  if (!company) return;

  // Ensure status reflects active payment
  await pool.query(
    `UPDATE companies SET subscription_status = 'active', updated_at = now()
     WHERE id = $1 AND subscription_status = 'past_due'`,
    [company.id]
  );

  console.log(`[billing] payment succeeded — company ${company.id} invoice ${invoice.id}`);
}

export async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  if (!customerId) return;

  const company = await companyByStripeCustomer(customerId);
  if (!company) return;

  await pool.query(
    `UPDATE companies SET subscription_status = 'past_due', updated_at = now()
     WHERE id = $1`,
    [company.id]
  );

  // TODO: send "payment failed" email to company admins
  console.warn(`[billing] payment failed — company ${company.id} invoice ${invoice.id}`);
}
