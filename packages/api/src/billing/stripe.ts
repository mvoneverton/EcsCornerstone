import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[billing] STRIPE_SECRET_KEY not set — Stripe calls will fail. Set it in .env for billing to work.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_missing', {
  apiVersion: '2023-10-16',
  typescript: true,
  maxNetworkRetries: 3,
});

export default stripe;
