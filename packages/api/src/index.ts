import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRouter    from './auth/router';
import adminRouter   from './admin/router';
import assessRouter  from './assess/router';
import billingRouter from './billing/router';
import { errorHandler, notFound, auditLog, generalRateLimiter } from './middleware';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ── Security headers ──────────────────────────────────────────────────────────
// Disable CSP in production so the bundled React SPA can load without inline-
// script violations; tighten this per-environment once CSP is configured.
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? false : undefined,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
);

// ── Cookie parsing (needed for refresh token HttpOnly cookie) ─────────────────
app.use(cookieParser());

// ── Body parsing ──────────────────────────────────────────────────────────────
// Stripe webhooks need the raw body — mount that route BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
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
const server = app.listen(PORT, () => {
  console.log(`[api] Server running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
});

// Graceful shutdown — close Puppeteer browser and DB pool
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
