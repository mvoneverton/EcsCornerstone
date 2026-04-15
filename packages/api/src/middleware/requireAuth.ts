import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';

/**
 * Validates the Bearer access token and attaches the decoded payload to req.user.
 * Returns 401 if the token is missing, malformed, or expired.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Authentication required', code: 'NO_TOKEN' } });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } });
    return;
  }

  req.user = payload;
  next();
}
