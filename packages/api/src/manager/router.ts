import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { listManagerPositions, getManagerPosition } from './handlers';

const router = Router();

router.use(requireAuth, requireRole('manager'));

router.get('/positions',              listManagerPositions);
router.get('/positions/:positionId',  getManagerPosition);

export default router;
