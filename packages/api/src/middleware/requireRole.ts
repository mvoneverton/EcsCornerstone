import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types';

/**
 * Returns middleware that allows only the specified roles.
 * Must be used AFTER requireAuth (depends on req.user being set).
 *
 * Usage: router.get('/admin/thing', requireAuth, requireRole('company_admin', 'super_admin'), handler)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Authentication required', code: 'NO_TOKEN' } });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: { message: 'Insufficient permissions', code: 'FORBIDDEN' } });
      return;
    }

    next();
  };
}
