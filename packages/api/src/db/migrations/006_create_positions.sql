-- Positions represent job roles used as benchmarks in Job Analysis (JA).
-- consensus_a/r_percentile are set after all JA respondents submit.
CREATE TABLE positions (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             uuid        NOT NULL REFERENCES companies(id),
  title                  text        NOT NULL,
  consensus_a_percentile numeric(5,2),
  consensus_r_percentile numeric(5,2),
  status                 text        NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','consensus_pending','finalized')),
  finalized_at           timestamptz,
  finalized_by           uuid        REFERENCES users(id),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  archived_at            timestamptz
);

CREATE INDEX positions_company_id_idx ON positions(company_id);
CREATE INDEX positions_active_idx     ON positions(company_id, status) WHERE archived_at IS NULL;

CREATE TRIGGER positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
