-- Add manager and employee roles alongside the existing four.
-- facilitator and respondent are untouched.
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin','company_admin','facilitator','respondent','manager','employee'));

-- Company-level gated service unlocks (Agent Placement / FCAIO), issued by
-- super_admin from the super admin dashboard. This is a separate mechanism
-- from the existing per-user client unlock flow (admin/pathHandlers.ts),
-- which continues to use user_id + paths[] exactly as before.
--
-- The two flows share this table but write structurally different rows:
--   per-user unlock:    user_id set, paths[] set,      path_type NULL
--   per-company unlock: company_id set, path_type set, user_id NULL, paths NULL
ALTER TABLE path_tokens
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN paths   DROP NOT NULL,
  ADD COLUMN path_type  text CHECK (path_type IN ('agent_placement', 'fcaio')),
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE path_tokens ADD CONSTRAINT path_tokens_shape_check CHECK (
  (path_type IS NULL     AND user_id IS NOT NULL AND paths IS NOT NULL) OR
  (path_type IS NOT NULL AND user_id IS NULL      AND paths IS NULL)
);

CREATE INDEX IF NOT EXISTS path_tokens_company_path_type_idx
  ON path_tokens(company_id, path_type) WHERE path_type IS NOT NULL;
