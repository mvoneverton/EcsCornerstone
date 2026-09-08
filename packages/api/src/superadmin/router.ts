import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';
import {
  listCompanies,
  getCompanyDetail,
  updateCompanyPlan,
  updateCompanySubscriptionStatus,
  unlockCompanyPath,
  revokeCompanyPath,
  getAnalytics,
  impersonateCompany,
  exitImpersonation,
  listAuditLog,
} from './handlers';

const router = Router();

// requireAuth only — exit-impersonation must be reachable by an active
// impersonation session (role=company_admin, impersonatedBy set), not just
// a genuine super_admin. Every other route below is super_admin-only.
router.use(requireAuth);

router.get('/exit-impersonation', exitImpersonation);

router.get('/companies',                                requireSuperAdmin, listCompanies);
router.get('/companies/:companyId',                      requireSuperAdmin, getCompanyDetail);
router.patch('/companies/:companyId/plan',                requireSuperAdmin, updateCompanyPlan);
router.patch('/companies/:companyId/subscription-status', requireSuperAdmin, updateCompanySubscriptionStatus);
router.post('/companies/:companyId/unlock-path',           requireSuperAdmin, unlockCompanyPath);
router.delete('/companies/:companyId/revoke-path',         requireSuperAdmin, revokeCompanyPath);

router.get('/analytics', requireSuperAdmin, getAnalytics);
router.get('/audit-log', requireSuperAdmin, listAuditLog);

router.post('/impersonate/:companyId', requireSuperAdmin, impersonateCompany);

export default router;
