CREATE TABLE pf_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES pf_events(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  token VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pf_invitations_event  ON pf_invitations(event_id);
CREATE INDEX idx_pf_invitations_token  ON pf_invitations(token);
CREATE INDEX idx_pf_invitations_status ON pf_invitations(status);
