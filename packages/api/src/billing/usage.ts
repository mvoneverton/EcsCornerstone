import pool from '../db/client';
import stripe from './stripe';

/**
 * Count assessment invitations sent by a company within a calendar period.
 * Used for plan limit enforcement and overage calculation.
 */
export async function countAssessmentsInPeriod(
  companyId:   string,
  periodStart: Date,
  periodEnd:   Date
): Promise<number> {
  const { rows: [row] } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM assessment_invitations
     WHERE company_id = $1
       AND created_at >= $2
       AND created_at <  $3`,
    [companyId, periodStart, periodEnd]
  );
  return parseInt(row?.count ?? '0', 10);
}

/**
 * Fetch the company's plan limit and overage price for a given Stripe subscription.
 */
async function getPlanDetails(companyId: string): Promise<{
  limit:             number | null;
  overagePriceCents: number;
  stripeCustomerId:  string | null;
} | null> {
  const { rows: [row] } = await pool.query<{
    assessment_limit_monthly: number | null;
    overage_price_cents:      number;
    stripe_customer_id:       string | null;
  }>(
    `SELECT p.assessment_limit_monthly, p.overage_price_cents, c.stripe_customer_id
     FROM companies c
     JOIN plans p ON p.id = c.plan_id
     WHERE c.id = $1 AND c.deleted_at IS NULL`,
    [companyId]
  );
  if (!row) return null;
  return {
    limit:             row.assessment_limit_monthly,
    overagePriceCents: row.overage_price_cents,
    stripeCustomerId:  row.stripe_customer_id,
  };
}

/**
 * Called from the invoice.upcoming webhook before each billing period closes.
 * Calculates assessments used this period, subtracts the plan limit,
 * and adds a Stripe InvoiceItem for each overage assessment.
 *
 * Stripe collects the flat subscription fee + any pending invoice items at
 * period end — so overages are billed automatically on the next invoice.
 */
export async function reportOveragesForPeriod(
  companyId:   string,
  periodStart: Date,
  periodEnd:   Date
): Promise<{ overage: number; invoiceItemId: string | null }> {
  const plan = await getPlanDetails(companyId);
  if (!plan || !plan.limit || !plan.stripeCustomerId) {
    // Enterprise (unlimited) or no Stripe customer — nothing to report
    return { overage: 0, invoiceItemId: null };
  }

  const used    = await countAssessmentsInPeriod(companyId, periodStart, periodEnd);
  const overage = Math.max(0, used - plan.limit);

  if (overage === 0) return { overage: 0, invoiceItemId: null };

  const item = await stripe.invoiceItems.create({
    customer:    plan.stripeCustomerId,
    amount:      overage * plan.overagePriceCents,
    currency:    'usd',
    description: `Assessment overage — ${overage} assessment${overage !== 1 ? 's' : ''} above plan limit`,
    metadata: {
      company_id:   companyId,
      period_start: periodStart.toISOString(),
      period_end:   periodEnd.toISOString(),
      used:         String(used),
      limit:        String(plan.limit),
      overage:      String(overage),
    },
  });

  console.log(`[billing] overage item created: ${item.id} — ${overage} units × $${plan.overagePriceCents / 100}`);
  return { overage, invoiceItemId: item.id };
}

/**
 * Resolve a Stripe customer ID back to our company.
 */
export async function companyByStripeCustomer(stripeCustomerId: string): Promise<{
  id:      string;
  plan_id: string | null;
} | null> {
  const { rows: [row] } = await pool.query<{ id: string; plan_id: string | null }>(
    `SELECT id, plan_id FROM companies WHERE stripe_customer_id = $1 AND deleted_at IS NULL`,
    [stripeCustomerId]
  );
  return row ?? null;
}

/**
 * Find a plan by its Stripe monthly or annual price ID.
 */
export async function planByStripePrice(stripePriceId: string): Promise<{
  id:   string;
  name: string;
} | null> {
  const { rows: [row] } = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM plans
     WHERE stripe_price_monthly = $1 OR stripe_price_annually = $1
     LIMIT 1`,
    [stripePriceId]
  );
  return row ?? null;
}
