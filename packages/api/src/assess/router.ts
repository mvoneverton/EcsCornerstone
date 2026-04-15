import { Router } from 'express';
import { getAssessment, saveResponse, submitAssessment } from './handlers';
import { respondentGetReportUrl } from '../reports/handlers';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Light rate limiting on public assess routes — token guessing is
// computationally infeasible (64 random hex chars) but we still cap
// bulk probing to avoid log spam and wasted DB queries.
const assessLimiter = createRateLimiter({
  prefix:        'assess',
  windowSeconds: 60,
  max:           60,
});

/** Validate token, return metadata + in-progress responses */
router.get('/:token', assessLimiter, getAssessment);

/** Autosave a single response */
router.post('/:token/response', assessLimiter, saveResponse);

/** Finalise — score, persist results, mark complete */
router.post('/:token/submit', assessLimiter, submitAssessment);

/** Download completed report (pre-signed S3 URL) */
router.get('/:token/report', assessLimiter, respondentGetReportUrl);

export default router;
