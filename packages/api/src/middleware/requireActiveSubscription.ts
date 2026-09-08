import { Request, Response, NextFunction } from 'express';
import pool from '../db/client';

const ALLOWED_STATUSES = ['active', 'trialing'];

/**
 * Blocks admin/* access for companies without a paid subscription.
 * Must be used AFTER requireAuth (depends on req.user.companyId).
 *
 * super_admins have no companyId (they aren't a paying tenant) and are
 * never subject to this check — routes that allow super_admin already
 * scope what they can touch via requireRole.
 */
export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user?.companyId) {
    next();
    return;
  }

  const { rows: [company] } = await pool.query<{ subscription_status: string }>(
    `SELECT subscription_status FROM companies WHERE id = $1`,
    [req.user.companyId]
  );

  if (!company || !ALLOWED_STATUSES.includes(company.subscription_status)) {
    res.status(402).json({
      error:  { message: 'An active subscription is required', code: 'SUBSCRIPTION_REQUIRED' },
      status: company?.subscription_status ?? 'unknown',
    });
    return;
  }

  next();
}
