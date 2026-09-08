/**
 * Seed data — subscription plans.
 * Safe to run multiple times (upserts on name).
 */
import 'dotenv/config';
import pool from './client';

const plans = [
  {
    name: 'Starter',
    price_monthly_cents: 9900,
    price_annually_cents: 95040, // $792/yr = ~$66/mo — 20% discount
    assessment_limit_monthly: 10,
    features: ['pca', 'wsa', 'pdf_reports', 'email_invitations'],
    stripe_price_monthly:  process.env.STRIPE_PRICE_STARTER_MONTHLY  ?? null,
    stripe_price_annually: process.env.STRIPE_PRICE_STARTER_ANNUALLY ?? null,
  },
  {
    name: 'Growth',
    price_monthly_cents: 29900,
    price_annually_cents: 287040, // $2390.40/yr — 20% discount
    assessment_limit_monthly: 50,
    features: [
      'pca',
      'wsa',
      'ja',
      'pdf_reports',
      'email_invitations',
      'position_benchmarking',
      'team_reporting',
    ],
    stripe_price_monthly:  process.env.STRIPE_PRICE_GROWTH_MONTHLY  ?? null,
    stripe_price_annually: process.env.STRIPE_PRICE_GROWTH_ANNUALLY ?? null,
  },
  {
    name: 'Enterprise',
    price_monthly_cents: 0,       // custom pricing — invoiced separately
    price_annually_cents: 0,
    assessment_limit_monthly: null, // unlimited
    features: [
      'pca',
      'wsa',
      'ja',
      'pdf_reports',
      'email_invitations',
      'position_benchmarking',
      'team_reporting',
      'sso',
      'custom_branding',
      'dedicated_support',
      'api_access',
    ],
    // No Stripe prices — Enterprise is sold via contact/invoice, not self-serve checkout.
    stripe_price_monthly:  null,
    stripe_price_annually: null,
  },
];

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const plan of plans) {
      await client.query(
        `INSERT INTO plans
           (name, price_monthly_cents, price_annually_cents, assessment_limit_monthly, features,
            stripe_price_monthly, stripe_price_annually)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
         ON CONFLICT (name) DO UPDATE SET
           price_monthly_cents      = EXCLUDED.price_monthly_cents,
           price_annually_cents     = EXCLUDED.price_annually_cents,
           assessment_limit_monthly = EXCLUDED.assessment_limit_monthly,
           features                 = EXCLUDED.features,
           stripe_price_monthly     = COALESCE(EXCLUDED.stripe_price_monthly, plans.stripe_price_monthly),
           stripe_price_annually    = COALESCE(EXCLUDED.stripe_price_annually, plans.stripe_price_annually),
           updated_at               = now()`,
        [
          plan.name,
          plan.price_monthly_cents,
          plan.price_annually_cents,
          plan.assessment_limit_monthly,
          JSON.stringify(plan.features),
          plan.stripe_price_monthly,
          plan.stripe_price_annually,
        ]
      );
      console.log(`[seed] ✓ plan: ${plan.name}`);
    }
    console.log('[seed] Done.');
  } catch (err) {
    console.error('[seed] Error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
