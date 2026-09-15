CREATE TABLE pf_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES pf_invitations(id),
  event_id UUID NOT NULL REFERENCES pf_events(id),
  primary_profile VARCHAR(50) NOT NULL,
  secondary_profile VARCHAR(50),
  assertiveness_score INTEGER NOT NULL,
  responsiveness_score INTEGER NOT NULL,
  assertiveness_percentile NUMERIC(5,2) NOT NULL,
  responsiveness_percentile NUMERIC(5,2) NOT NULL,
  self_perspective JSONB NOT NULL,
  work_perspective JSONB NOT NULL,
  others_perspective JSONB NOT NULL,
  validity_flags JSONB DEFAULT '[]',
  results_email_sent BOOLEAN NOT NULL DEFAULT false,
  results_email_sent_at TIMESTAMPTZ,
  raw_scoring_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pf_results_invitation ON pf_results(invitation_id);
CREATE INDEX idx_pf_results_event      ON pf_results(event_id);
CREATE INDEX idx_pf_results_profile    ON pf_results(primary_profile);

ALTER TABLE pf_invitations
  ADD CONSTRAINT fk_pf_invitations_result
  FOREIGN KEY (result_id) REFERENCES pf_results(id);
