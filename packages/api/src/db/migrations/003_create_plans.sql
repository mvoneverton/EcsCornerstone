-- plans must be created before companies (companies.plan_id → plans.id)
CREATE TABLE plans (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     text        NOT NULL UNIQUE,
  price_monthly_cents      integer     NOT NULL,
  price_annually_cents     integer     NOT NULL,
  assessment_limit_monthly integer,                 -- NULL = unlimited
  features                 jsonb       NOT NULL DEFAULT '[]',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
