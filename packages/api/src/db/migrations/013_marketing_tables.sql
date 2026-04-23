-- Marketing inquiry tables

CREATE TABLE IF NOT EXISTS audit_inquiries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       text        NOT NULL,
  last_name        text        NOT NULL,
  company_name     text        NOT NULL,
  title            text,
  email            text        NOT NULL,
  phone            text,
  company_size     text,
  industry         text,
  assessment_count text,
  message          text        NOT NULL,
  referral_source  text,
  status           text        NOT NULL DEFAULT 'new',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fcaio_inquiries (
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

CREATE TABLE IF NOT EXISTS cornerstone_waitlist (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text        NOT NULL,
  email      text        UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_audit_inquiries_updated_at
  BEFORE UPDATE ON audit_inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_fcaio_inquiries_updated_at
  BEFORE UPDATE ON fcaio_inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
