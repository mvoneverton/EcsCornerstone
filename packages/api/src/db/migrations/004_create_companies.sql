CREATE TABLE companies (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  plan_id    uuid        REFERENCES plans(id),
  logo_url   text,
  sso_config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX companies_slug_idx      ON companies(slug);
CREATE INDEX companies_deleted_at_idx ON companies(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
