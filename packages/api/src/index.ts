import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRouter      from './auth/router';
import adminRouter     from './admin/router';
import assessRouter    from './assess/router';
import billingRouter   from './billing/router';
import marketingRouter from './marketing/router';
import { errorHandler, notFound, auditLog, generalRateLimiter } from './middleware';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// ── Security headers ──────────────────────────────────────────────────────────
// Disable CSP in production so the bundled React SPA can load without inline-
// script violations; tighten this per-environment once CSP is configured.
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? false : undefined,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://evertonconsultingservices.org',
  'https://www.evertonconsultingservices.org',
  process.env.FRONTEND_URL,
  process.env.MARKETING_URL,
].filter(Boolean) as string[];

app.options('*', cors());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postmark webhooks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Cookie parsing (needed for refresh token HttpOnly cookie) ─────────────────
app.use(cookieParser());

// ── Body parsing ──────────────────────────────────────────────────────────────
// Webhook routes need the raw body — mount BEFORE express.json()
app.use('/api/billing/webhook',   express.raw({ type: 'application/json' }));
app.use('/api/webhooks/stripe',   express.raw({ type: 'application/json' }));
app.use('/api/webhooks/calendly', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── General rate limiting ─────────────────────────────────────────────────────
app.use('/api', generalRateLimiter);

// ── Audit log (authenticated mutations) ───────────────────────────────────────
app.use(auditLog);

// ── Health check ──────────────────────────────────────────────────────────────
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
app.get('/health',     healthHandler);  // legacy path
app.get('/api/health', healthHandler);  // canonical path used by Railway

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRouter);
app.use('/api/admin',   adminRouter);
app.use('/api/assess',  assessRouter);
app.use('/api/billing', billingRouter);
app.use('/api',         marketingRouter);

// ── Static frontend (production only) ────────────────────────────────────────
// In production the API serves the pre-built React SPA.  The web dist folder
// lives at ../../web/dist relative to packages/api/dist/index.js (__dirname).
if (process.env.NODE_ENV === 'production') {
  const webDist = path.resolve(__dirname, '../../web/dist');
  app.use(express.static(webDist));
  // SPA fallback — any route that is not under /api gets index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

// ── 404 / Error handling ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// ── In-process cron (set ENABLE_CRON=true to activate) ───────────────────────
// For production, prefer a dedicated Railway cron service running:
//   node packages/api/dist/cron/followUpFlag.js  on schedule  0 */6 * * *
// Set ENABLE_CRON=true only when running without a separate cron service.
if (process.env.ENABLE_CRON === 'true') {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  import('./cron/followUpFlag').then(({ runFollowUpFlagJob }) => {
    // Run once on startup, then every 6 hours
    runFollowUpFlagJob().catch((err: unknown) =>
      console.error('[cron] initial follow-up flag job failed', err)
    );
    setInterval(() => {
      runFollowUpFlagJob().catch((err: unknown) =>
        console.error('[cron] follow-up flag job failed', err)
      );
    }, SIX_HOURS);
  }).catch((err: unknown) => console.error('[cron] failed to load follow-up flag module', err));
}

// ── Graceful shutdown — close Puppeteer browser and DB pool ──────────────────
async function shutdown(signal: string) {
  console.log(`[api] ${signal} received — shutting down`);
  server.close(async () => {
    const { closeBrowser } = await import('./reports/generator');
    await closeBrowser().catch(() => null);
    process.exit(0);
  });
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT',  () => shutdown('SIGINT'));

export default app;
