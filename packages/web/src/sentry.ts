import * as Sentry from '@sentry/react';

// Initialise Sentry only when a DSN is configured. Local dev runs without it.
const dsn = import.meta.env.VITE_SENTRY_DSN_WEB as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  });
}

export { Sentry };
