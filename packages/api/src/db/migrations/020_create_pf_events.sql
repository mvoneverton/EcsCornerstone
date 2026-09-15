CREATE TABLE pf_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  event_type VARCHAR(50) NOT NULL
    CHECK (event_type IN ('couples_night', 'family_session', 'youth_group', 'corporate_team')),
  facilitator_id UUID NOT NULL REFERENCES users(id),
  event_date TIMESTAMPTZ,
  location VARCHAR(300),
  is_free BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pf_events_facilitator ON pf_events(facilitator_id);
CREATE INDEX idx_pf_events_status      ON pf_events(status);
CREATE INDEX idx_pf_events_date        ON pf_events(event_date);

CREATE TRIGGER set_pf_events_updated_at
  BEFORE UPDATE ON pf_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
