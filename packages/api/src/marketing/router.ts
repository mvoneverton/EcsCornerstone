import { Router, type Request, type Response } from 'express';
import {
  createScanInquiry,
  createAssessmentInquiry,
  createFcaioInquiry,
  joinWaitlist,
  createCheckoutSession,
  getCheckoutSession,
} from './handlers';
import {
  createScanCheckoutSession,
  createAssessmentCheckoutSession,
  verifyScanSession,
  verifyAssessmentSession,
} from './bookingHandlers';
import {
  handleStripeBookingWebhook,
  handleCalendlyWebhook,
} from './webhookHandlers';
import {
  submitParticipantCount,
  getParticipantCountPage,
} from './participantHandlers';
import { validateToken } from '../admin/pathHandlers';

const router = Router();

// ── Public marketing inquiry endpoints ───────────────────────────────────────

router.post('/scan/inquiry',        createScanInquiry);
router.post('/assessment/inquiry',  createAssessmentInquiry);

// 301 redirect: /api/audit/inquiry → /api/assessment/inquiry
router.post('/audit/inquiry', (_req: Request, res: Response) => {
  res.redirect(301, '/api/assessment/inquiry');
});

router.post('/fcaio/inquiry', createFcaioInquiry);
router.post('/waitlist',      joinWaitlist);

// ── Legacy agent reservation checkout (Reserve page) ─────────────────────────

router.post('/stripe/create-checkout-session', createCheckoutSession);
router.get('/stripe/session/:sessionId',        getCheckoutSession);

// ── Scan booking flow ─────────────────────────────────────────────────────────

router.post('/scan/create-checkout-session', createScanCheckoutSession);
router.get('/scan/verify-session',           verifyScanSession);

// ── Assessment booking flow ───────────────────────────────────────────────────

router.post('/assessment/create-checkout-session', createAssessmentCheckoutSession);
router.get('/assessment/verify-session',           verifyAssessmentSession);

// ── Participant count (fallback web page + email form) ────────────────────────

router.get('/assessment/participant-count',  getParticipantCountPage);
router.post('/assessment/participant-count', submitParticipantCount);

// ── Webhooks ──────────────────────────────────────────────────────────────────
// Note: raw body parsing for these routes is mounted in src/index.ts
// before express.json() — the body arrives as a Buffer in both handlers.

router.post('/webhooks/stripe',   handleStripeBookingWebhook);
router.post('/webhooks/calendly', handleCalendlyWebhook);

// ── Public path token validation ─────────────────────────────────────────────

router.get('/validate-path-token/:token', validateToken);

export default router;
