import pool from '../db/client';

export type AuditAction =
  | 'company.plan_changed'
  | 'company.status_overridden'
  | 'path.unlocked'
  | 'path.revoked'
  | 'impersonation.started'
  | 'impersonation.ended';

interface LogAuditInput {
  adminUserId: string;
  companyId?:  string | null;
  action:      AuditAction;
  oldValue?:   unknown;
  newValue?:   unknown;
  ipAddress?:  string | null;
}

export async function logAudit(input: LogAuditInput): Promise<void> {
  await pool.query(
    `INSERT INTO super_admin_audit_log
       (admin_user_id, company_id, action, old_value, new_value, ip_address)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
    [
      input.adminUserId,
      input.companyId ?? null,
      input.action,
      input.oldValue !== undefined ? JSON.stringify(input.oldValue) : null,
      input.newValue !== undefined ? JSON.stringify(input.newValue) : null,
      input.ipAddress ?? null,
    ]
  );
}
