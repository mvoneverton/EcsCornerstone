import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight audit logger. Logs authenticated mutations (non-GET requests
 * from authenticated users) to stdout in a structured format.
 *
 * In production, route stdout to a log aggregator (CloudWatch, Datadog, etc.).
 * A full audit_log table can be added in a future migration if a queryable
 * audit trail is required.
 */
export function auditLog(req: Request, _res: Response, next: NextFunction): void {
  if (req.method !== 'GET' && req.user) {
    console.log(
      JSON.stringify({
        type:      'audit',
        ts:        new Date().toISOString(),
        userId:    req.user.sub,
        companyId: req.user.companyId,
        role:      req.user.role,
        method:    req.method,
        path:      req.path,
        ip:        req.ip,
      })
    );
  }
  next();
}
