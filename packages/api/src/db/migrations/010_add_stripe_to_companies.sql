-- Stripe identifiers and subscription state on the company record.
-- stripe_customer_id    — Stripe Customer object (cus_xxx)
-- stripe_subscription_id — active Subscription object (sub_xxx)
-- subscription_status   — mirrors Stripe's subscription.status field
-- current_period_end    — when the current billing period ends (for UI display)
-- trial_ends_at         — null when not trialling

ALTER TABLE companies
  ADD COLUMN stripe_customer_id     text UNIQUE,
  ADD COLUMN stripe_subscription_id text UNIQUE,
  ADD COLUMN subscription_status    text NOT NULL DEFAULT 'incomplete',
  ADD COLUMN current_period_end     timestamptz,
  ADD COLUMN trial_ends_at          timestamptz;

CREATE INDEX companies_stripe_customer_idx ON companies(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
