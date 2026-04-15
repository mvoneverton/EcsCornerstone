CREATE TABLE users (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        REFERENCES companies(id),   -- NULL for super_admins
  email            text        NOT NULL UNIQUE,
  password_hash    text,                                    -- NULL if SSO-only
  role             text        NOT NULL
                   CHECK (role IN ('super_admin','company_admin','facilitator','respondent')),
  first_name       text        NOT NULL,
  last_name        text        NOT NULL,
  current_position text,
  invited_by       uuid        REFERENCES users(id),
  last_login_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

-- Lookups by company (most admin queries are company-scoped)
CREATE INDEX users_company_id_idx   ON users(company_id);
-- Partial index for active users only
CREATE INDEX users_active_idx       ON users(company_id, role) WHERE deleted_at IS NULL;
-- Email login lookup
CREATE INDEX users_email_idx        ON users(email);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
