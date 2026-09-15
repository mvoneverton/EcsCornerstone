import { Router } from 'express';
import { getInvitation, saveResponses, submitAssessment } from './assessHandlers';

const router = Router();

// No auth — token in URL is the sole credential for attendees
router.get('/:token',       getInvitation);
router.post('/:token/save', saveResponses);
router.post('/:token/submit', submitAssessment);

export default router;
