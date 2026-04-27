import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import {
  createWorkOrder,
  createWorkOrderValidation,
  issueWorkOrder,
  issueWorkOrderValidation,
  listWorkOrders,
  getWorkOrder,
  assignProcess,
  assignProcessValidation,
  startProcess,
} from '../controllers/workOrderController';
import { UserRole } from '../config';

const router = Router();

router.use(authenticateToken);

router.get('/', listWorkOrders);
router.get('/:id', getWorkOrder);
router.post('/', requireRoles(UserRole.PLANNER), createWorkOrderValidation, createWorkOrder);
router.post('/:id/issue', requireRoles(UserRole.PLANNER), issueWorkOrderValidation, issueWorkOrder);
router.post('/process/:processId/assign', requireRoles(UserRole.TEAM_LEADER), assignProcessValidation, assignProcess);
router.post('/process/:processId/start', requireRoles(UserRole.OPERATOR, UserRole.TEAM_LEADER), startProcess);

export default router;
