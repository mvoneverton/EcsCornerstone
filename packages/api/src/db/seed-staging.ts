/**
 * Staging seed — subscription plans + one test Company Admin account.
 * Safe to run multiple times (upserts on name / email).
 *
 * Usage:
 *   npm run db:seed:staging --workspace=packages/api
 *   — or from the repo root —
 *   npm run db:seed:staging
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './client';

// ── Plans ─────────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Starter',
    price_monthly_cents: 9900,
    price_annually_cents: 95040,
    assessment_limit_monthly: 10,
    features: ['pca', 'wsa', 'pdf_reports', 'email_invitations'],
  },
  {
    name: 'Growth',
    price_monthly_cents: 29900,
    price_annually_cents: 287040,
    assessment_limit_monthly: 50,
    features: [
      'pca', 'wsa', 'ja',
      'pdf_reports', 'email_invitations',
      'position_benchmarking', 'team_reporting',
    ],
  },
  {
    name: 'Enterprise',
    price_monthly_cents: 0,
    price_annually_cents: 0,
    assessment_limit_monthly: null,
    features: [
      'pca', 'wsa', 'ja',
      'pdf_reports', 'email_invitations',
      'position_benchmarking', 'team_reporting',
      'sso', 'custom_branding', 'dedicated_support', 'api_access',
    ],
  },
];

// ── Test account ──────────────────────────────────────────────────────────────
const TEST_EMAIL    = 'admin@test.ecscornerstone.com';
const TEST_PASSWORD = 'StagingTest2025!';
const TEST_COMPANY  = 'ECS Test Company';

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Upsert subscription plans
    for (const plan of plans) {
      await client.query(
        `INSERT INTO plans
           (name, price_monthly_cents, price_annually_cents, assessment_limit_monthly, features)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (name) DO UPDATE SET
           price_monthly_cents      = EXCLUDED.price_monthly_cents,
           price_annually_cents     = EXCLUDED.price_annually_cents,
           assessment_limit_monthly = EXCLUDED.assessment_limit_monthly,
           features                 = EXCLUDED.features,
           updated_at               = now()`,
        [
          plan.name,
          plan.price_monthly_cents,
          plan.price_annually_cents,
          plan.assessment_limit_monthly,
          JSON.stringify(plan.features),
        ]
      );
      console.log(`[seed:staging] ✓ plan: ${plan.name}`);
    }

    // 2. Resolve the Growth plan id (used for the test company)
    const planRow = await client.query<{ id: string }>(
      `SELECT id FROM plans WHERE name = 'Growth' LIMIT 1`
    );
    if (planRow.rowCount === 0) throw new Error('Growth plan not found after upsert');
    const growthPlanId = planRow.rows[0].id;

    // 3. Upsert test company
    const companyRow = await client.query<{ id: string }>(
      `INSERT INTO companies (name, slug, plan_id, subscription_status)
       VALUES ($1, $2, $3, 'trialing')
       ON CONFLICT (slug) DO UPDATE SET
         name       = EXCLUDED.name,
         updated_at = now()
       RETURNING id`,
      [TEST_COMPANY, 'ecs-test-company', growthPlanId]
    );
    const companyId = companyRow.rows[0].id;
    console.log(`[seed:staging] ✓ company: ${TEST_COMPANY} (id: ${companyId})`);

    // 4. Upsert test Company Admin user
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
    await client.query(
      `INSERT INTO users
         (company_id, email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, 'company_admin', 'Test', 'Admin')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         updated_at    = now()`,
      [companyId, TEST_EMAIL, passwordHash]
    );
    console.log(`[seed:staging] ✓ user: ${TEST_EMAIL} (company_admin)`);

    await client.query('COMMIT');
    console.log('[seed:staging] Done.');
    console.log('');
    console.log('  Login credentials for staging testers:');
    console.log(`    Email:    ${TEST_EMAIL}`);
    console.log(`    Password: ${TEST_PASSWORD}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed:staging] Error — rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
