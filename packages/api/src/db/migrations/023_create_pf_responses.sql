CREATE TABLE pf_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES pf_invitations(id),
  event_id UUID NOT NULL REFERENCES pf_events(id),
  instrument_type VARCHAR(10) NOT NULL CHECK (instrument_type IN ('pca', 'wsa')),
  responses JSONB NOT NULL,
  is_partial BOOLEAN NOT NULL DEFAULT true,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_pf_responses_unique ON pf_responses(invitation_id, instrument_type);
CREATE INDEX idx_pf_responses_event ON pf_responses(event_id);
