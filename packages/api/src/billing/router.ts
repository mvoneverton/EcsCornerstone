import { Router } from 'express';
import Stripe from 'stripe';
import stripeClient from './stripe';
import { requireAuth } from '../middleware';
import {
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoiceUpcoming,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from './webhooks';
import { getSubscription, createPortalSession } from './handlers';

const router = Router();

// ── POST /api/billing/webhook ─────────────────────────────────────────────────
// express.raw() is mounted in src/index.ts before express.json() — body is a Buffer here.

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[billing] STRIPE_WEBHOOK_SECRET not set');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body as Buffer, sig as string, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`[billing] webhook signature verification failed: ${msg}`);
    res.status(400).json({ error: `Webhook Error: ${msg}` });
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Acknowledge but ignore unhandled event types
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error(`[billing] error handling event ${event.type}:`, err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ── GET /api/billing/subscription ────────────────────────────────────────────

router.get('/subscription', requireAuth, getSubscription);

// ── POST /api/billing/portal ──────────────────────────────────────────────────

router.post('/portal', requireAuth, createPortalSession);

export default router;
