// Sentry initialisation — imported first thing in index.ts so the SDK can
// instrument http/express before those modules are required.
//
// If SENTRY_DSN_API is not set we skip init entirely: local dev doesn't need
// error monitoring and we don't want noisy "no DSN" warnings.
import 'dotenv/config';
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN_API;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
  });
  console.log('[sentry] error monitoring initialised');
}

export { Sentry };
