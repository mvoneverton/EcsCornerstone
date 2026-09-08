/**
 * Environment verification.
 *
 * `verifyEnvironment()` runs synchronously on API startup (see src/index.ts)
 * and as a Railway deploy check. It logs a PASS/FAIL line for every variable
 * and, if any hard-required variable is missing or malformed, prints the full
 * list of failures and exits the process with code 1.
 *
 * Run standalone:  npx ts-node src/scripts/verifyEnvironment.ts
 *   (the standalone run also performs a best-effort DB connectivity check)
 */
import 'dotenv/config';

type CheckResult =
  | { level: 'pass'; name: string; detail: string }
  | { level: 'warn'; name: string; detail: string }
  | { level: 'fail'; name: string; detail: string };

/** First env var in `names` that has a non-empty value. */
function firstSet(names: string[]): { name: string; value: string } | null {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim() !== '') return { name, value };
  }
  return null;
}

interface RequiredSpec {
  /** Primary name plus accepted aliases. */
  names: string[];
  /** Optional extra validation — return an error string, or null when valid. */
  validate?: (value: string) => string | null;
}

const HARD_REQUIRED: RequiredSpec[] = [
  { names: ['DATABASE_URL'] },
  {
    names: ['JWT_ACCESS_SECRET', 'JWT_SECRET'],
    validate: (v) => (v.length >= 32 ? null : `too short (${v.length} chars, need ≥ 32)`),
  },
  {
    names: ['JWT_REFRESH_SECRET', 'JWT_SECRET'],
    validate: (v) => (v.length >= 32 ? null : `too short (${v.length} chars, need ≥ 32)`),
  },
  {
    names: ['PATH_TOKEN_SECRET'],
    validate: (v) => (v.length >= 32 ? null : `too short (${v.length} chars, need ≥ 32)`),
  },
  {
    names: ['STRIPE_SECRET_KEY'],
    validate: (v) => (v.startsWith('sk_') ? null : 'must start with "sk_"'),
  },
  {
    names: ['STRIPE_WEBHOOK_SECRET'],
    validate: (v) => (v.startsWith('whsec_') ? null : 'must start with "whsec_"'),
  },
  {
    names: ['STRIPE_PRICE_STARTER_MONTHLY', 'STRIPE_STARTER_PRICE_ID'],
    validate: (v) => (v.startsWith('price_') ? null : 'must start with "price_"'),
  },
  {
    names: ['STRIPE_PRICE_GROWTH_MONTHLY', 'STRIPE_GROWTH_PRICE_ID'],
    validate: (v) => (v.startsWith('price_') ? null : 'must start with "price_"'),
  },
  {
    names: ['FRONTEND_URL'],
    validate: (v) => {
      try {
        // eslint-disable-next-line no-new
        new URL(v);
        return null;
      } catch {
        return 'not a valid URL';
      }
    },
  },
];

interface OptionalSpec {
  names: string[];
  missingNote: string;
}

const OPTIONAL: OptionalSpec[] = [
  { names: ['AWS_ACCESS_KEY_ID'],     missingNote: 'PDF report upload to S3 will fail' },
  { names: ['AWS_SECRET_ACCESS_KEY'], missingNote: 'PDF report upload to S3 will fail' },
  { names: ['AWS_REGION'],            missingNote: 'PDF report upload to S3 will fail' },
  { names: ['AWS_S3_BUCKET'],         missingNote: 'PDF report upload to S3 will fail' },
  { names: ['SENDGRID_API_KEY'],      missingNote: 'emails will log to console instead of sending' },
  { names: ['SENTRY_DSN_API'],        missingNote: 'backend error monitoring disabled' },
];

function evaluate(): CheckResult[] {
  const results: CheckResult[] = [];

  for (const spec of HARD_REQUIRED) {
    const hit = firstSet(spec.names);
    const label = spec.names[0];
    if (!hit) {
      results.push({
        level: 'fail',
        name: label,
        detail: 'not set (REQUIRED — platform will not start)',
      });
      continue;
    }
    const err = spec.validate?.(hit.value) ?? null;
    if (err) {
      results.push({
        level: 'fail',
        name: hit.name,
        detail: `${err} (REQUIRED — platform will not start)`,
      });
    } else {
      const suffix =
        label.includes('SECRET') || label.includes('JWT') || label.includes('TOKEN')
          ? ` (${hit.value.length} chars)`
          : '';
      results.push({ level: 'pass', name: hit.name, detail: `set${suffix}` });
    }
  }

  for (const spec of OPTIONAL) {
    const hit = firstSet(spec.names);
    if (hit) {
      results.push({ level: 'pass', name: hit.name, detail: 'set' });
    } else {
      results.push({ level: 'warn', name: spec.names[0], detail: `not set (${spec.missingNote})` });
    }
  }

  return results;
}

function render(results: CheckResult[]): void {
  for (const r of results) {
    if (r.level === 'pass') console.log(`✅ ${r.name} — ${r.detail}`);
    else if (r.level === 'warn') console.log(`⚠️  ${r.name} — ${r.detail}`);
    else console.log(`❌ ${r.name} — ${r.detail}`);
  }
}

/** Synchronous gate used on API startup. Exits the process on hard failure. */
export function verifyEnvironment(): void {
  console.log('── Environment verification ─────────────────────────────────');
  const results = evaluate();
  render(results);

  const failures = results.filter((r) => r.level === 'fail');
  if (failures.length > 0) {
    console.error(`\n${failures.length} required variable(s) missing or invalid:`);
    for (const f of failures) console.error(`  ❌ ${f.name} — ${f.detail}`);
    console.error('\nPlatform will not start. Set the variables above and retry.');
    process.exit(1);
  }
  console.log('────────────────────────────────────────────────────────────');
}

/** Best-effort connectivity checks — only run from the standalone script. */
async function verifyConnectivity(): Promise<void> {
  console.log('\n── Connectivity ────────────────────────────────────────────');
  try {
    const { default: pool } = await import('../db/client');
    await pool.query('SELECT 1');
    console.log('✅ DATABASE_URL — connection OK');
    await pool.end();
  } catch (err) {
    console.log(`⚠️  DATABASE_URL — could not connect (${(err as Error).message})`);
  }
}

if (require.main === module) {
  verifyEnvironment();
  verifyConnectivity()
    .then(() => process.exit(0))
    .catch(() => process.exit(0));
}
