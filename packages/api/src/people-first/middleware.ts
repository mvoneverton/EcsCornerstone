import { Request, Response, NextFunction } from 'express';

export function requireFacilitator(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: { message: 'Authentication required', code: 'NO_TOKEN' } });
    return;
  }
  if (req.user.role !== 'super_admin') {
    res.status(403).json({ error: { message: 'Insufficient permissions', code: 'FORBIDDEN' } });
    return;
  }
  next();
}
