-- Stripe Price IDs linked to each plan tier.
-- These are set after creating the products/prices in the Stripe dashboard
-- and should match the env vars STRIPE_PRICE_*_MONTHLY / _ANNUALLY.
ALTER TABLE plans
  ADD COLUMN stripe_price_monthly  text,
  ADD COLUMN stripe_price_annually text,
  ADD COLUMN overage_price_cents   integer NOT NULL DEFAULT 1500;
  -- overage_price_cents: per-assessment charge above the plan limit ($15 default)
