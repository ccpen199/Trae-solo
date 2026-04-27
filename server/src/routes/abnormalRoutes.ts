import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import {
  createAbnormal,
  createAbnormalValidation,
  assignAbnormal,
  assignAbnormalValidation,
  startProcessingAbnormal,
  resolveAbnormal,
  resolveAbnormalValidation,
  closeAbnormal,
  getAbnormals,
  getAbnormal,
  getDashboard,
  getStatistics,
} from '../controllers/abnormalController';
import { UserRole } from '../config';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboard);
router.get('/statistics', getStatistics);
router.get('/', getAbnormals);
router.get('/:id', getAbnormal);
router.post('/', createAbnormalValidation, createAbnormal);
router.post('/:id/assign', requireRoles(UserRole.MANAGER, UserRole.TEAM_LEADER), assignAbnormalValidation, assignAbnormal);
router.post('/:id/start', startProcessingAbnormal);
router.post('/:id/resolve', resolveAbnormalValidation, resolveAbnormal);
router.post('/:id/close', requireRoles(UserRole.MANAGER, UserRole.TEAM_LEADER), closeAbnormal);

export default router;
