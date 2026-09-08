-- Add company_id to assessment_responses, assessment_results, and path_tokens
-- so these tables can be scoped/filtered by company without joining through
-- assessment_invitations / users. Column only — queries are updated separately.

ALTER TABLE assessment_responses
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

ALTER TABLE path_tokens
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Backfill from assessment_invitations.company_id
UPDATE assessment_responses ar
SET company_id = ai.company_id
FROM assessment_invitations ai
WHERE ar.invitation_id = ai.id
  AND ar.company_id IS NULL;

UPDATE assessment_results ar
SET company_id = ai.company_id
FROM assessment_invitations ai
WHERE ar.invitation_id = ai.id
  AND ar.company_id IS NULL;

-- Backfill from users.company_id
UPDATE path_tokens pt
SET company_id = u.company_id
FROM users u
WHERE pt.user_id = u.id
  AND pt.company_id IS NULL;

-- Enforce NOT NULL now that existing rows are backfilled.
-- Fails loudly if any row's join target was missing/orphaned — that
-- indicates a data integrity issue to resolve before this can ship.
ALTER TABLE assessment_responses ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE assessment_results  ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE path_tokens         ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS responses_company_id_idx   ON assessment_responses(company_id);
CREATE INDEX IF NOT EXISTS results_company_id_idx     ON assessment_results(company_id);
CREATE INDEX IF NOT EXISTS path_tokens_company_id_idx ON path_tokens(company_id);
