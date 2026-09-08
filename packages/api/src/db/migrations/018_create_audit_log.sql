CREATE TABLE super_admin_audit_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  uuid        NOT NULL REFERENCES users(id),
  company_id     uuid        REFERENCES companies(id),
  action         varchar(100) NOT NULL,
  old_value      jsonb,
  new_value      jsonb,
  ip_address     varchar(45),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_company ON super_admin_audit_log(company_id);
CREATE INDEX idx_audit_log_admin   ON super_admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_created ON super_admin_audit_log(created_at DESC);
