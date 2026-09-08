import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';
import {
  getResultReportUrl,
  getResultReportUrlForRespondent,
  regenerateResultReport,
} from './handlers';

const router = Router();

// Token-based — no requireAuth, must come before the requireAuth-gated route below.
router.get('/:resultId/url/respondent', getResultReportUrlForRespondent);

router.get('/:resultId/url', requireAuth, getResultReportUrl);
router.post('/:resultId/regenerate', requireAuth, requireSuperAdmin, regenerateResultReport);

export default router;
