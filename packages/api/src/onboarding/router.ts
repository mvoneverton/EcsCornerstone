import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimiter';
import { register, listPlans } from './handlers';

const router = Router();

// Pre-authentication — no requireAuth on this router.
router.get('/plans',    listPlans);
router.post('/register', authRateLimiter, register);

export default router;
