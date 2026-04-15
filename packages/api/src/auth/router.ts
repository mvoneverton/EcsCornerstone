import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from './handlers';
import { authRateLimiter, passwordRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/register',       authRateLimiter,     register);
router.post('/login',          authRateLimiter,     login);
router.post('/refresh',        refresh);
router.post('/logout',         logout);
router.post('/forgot-password', passwordRateLimiter, forgotPassword);
router.post('/reset-password',  passwordRateLimiter, resetPassword);
router.post('/change-password', requireAuth,         changePassword);

export default router;
