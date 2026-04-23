-- Payment and Calendly columns for scan and assessment booking flows

ALTER TABLE scan_inquiries
  ADD COLUMN IF NOT EXISTS payment_status              text        NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS stripe_session_id           text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id    text,
  ADD COLUMN IF NOT EXISTS paid_at                     timestamptz,
  ADD COLUMN IF NOT EXISTS zoom_call_date              timestamptz,
  ADD COLUMN IF NOT EXISTS calendly_event_uri          text;

ALTER TABLE assessment_inquiries
  ADD COLUMN IF NOT EXISTS payment_status                    text        NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS stripe_session_id                 text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id          text,
  ADD COLUMN IF NOT EXISTS paid_at                           timestamptz,
  ADD COLUMN IF NOT EXISTS visit_date                        timestamptz,
  ADD COLUMN IF NOT EXISTS calendly_event_uri                text,
  ADD COLUMN IF NOT EXISTS participant_count                 integer,
  ADD COLUMN IF NOT EXISTS participant_count_received_at     timestamptz,
  ADD COLUMN IF NOT EXISTS participant_count_token_hash      text,
  ADD COLUMN IF NOT EXISTS follow_up_needed                  boolean     NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS scan_inquiries_stripe_session_id_idx
  ON scan_inquiries(stripe_session_id);

CREATE INDEX IF NOT EXISTS assessment_inquiries_stripe_session_id_idx
  ON assessment_inquiries(stripe_session_id);

CREATE INDEX IF NOT EXISTS assessment_inquiries_follow_up_idx
  ON assessment_inquiries(payment_status, follow_up_needed, paid_at)
  WHERE payment_status = 'paid' AND follow_up_needed = false AND participant_count IS NULL;
