-- Scan inquiries (new public offering at $1,000)
CREATE TABLE IF NOT EXISTS scan_inquiries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      text        NOT NULL,
  last_name       text        NOT NULL,
  company_name    text        NOT NULL,
  title           text,
  email           text        NOT NULL,
  phone           text,
  company_size    text,
  industry        text,
  message         text        NOT NULL,
  referral_source text,
  status          text        NOT NULL DEFAULT 'new',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER set_scan_inquiries_updated_at
  BEFORE UPDATE ON scan_inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Rename audit_inquiries to assessment_inquiries (keep old table as view for compatibility)
ALTER TABLE audit_inquiries RENAME TO assessment_inquiries;

CREATE VIEW audit_inquiries AS SELECT * FROM assessment_inquiries;

-- Client path unlocking
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS unlocked_paths    text[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS path_email_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS path_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text        NOT NULL UNIQUE,
  paths       text[]      NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS path_tokens_user_id_idx ON path_tokens(user_id);
CREATE INDEX IF NOT EXISTS path_tokens_token_hash_idx ON path_tokens(token_hash);
