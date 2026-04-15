CREATE TABLE assessment_invitations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id),
  respondent_id   uuid        NOT NULL REFERENCES users(id),
  assessment_type text        NOT NULL
                  CHECK (assessment_type IN ('pca','wsa','ja')),
  token           text        NOT NULL UNIQUE,
  sent_by         uuid        NOT NULL REFERENCES users(id),
  sent_at         timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  opened_at       timestamptz,
  completed_at    timestamptz,
  position_id     uuid        REFERENCES positions(id),  -- required for JA
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Company-scoped listing (admin dashboard)
CREATE INDEX invitations_company_id_idx    ON assessment_invitations(company_id);
-- Respondent lookup (show pending assessments)
CREATE INDEX invitations_respondent_id_idx ON assessment_invitations(respondent_id);
-- Token lookup on assessment entry (hot path)
CREATE INDEX invitations_token_idx         ON assessment_invitations(token);
-- Filtering by status
CREATE INDEX invitations_completed_at_idx  ON assessment_invitations(company_id, completed_at);

CREATE TRIGGER assessment_invitations_updated_at
  BEFORE UPDATE ON assessment_invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
