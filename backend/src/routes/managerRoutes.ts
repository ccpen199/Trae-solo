import { Router } from 'express';
import {
  getDepartmentLogs,
  evaluateDailyLog,
  getProjectFeedbacks,
  reportToGM,
  getMissingLogs
} from '../controllers/managerController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles(UserRole.DEPT_MANAGER, UserRole.GM, UserRole.ADMIN, UserRole.SUPERVISOR));

router.get('/logs', getDepartmentLogs);
router.post('/logs/:logId/evaluate', evaluateDailyLog);
router.get('/project-feedbacks', getProjectFeedbacks);
router.post('/project-feedbacks/:feedbackId/report', authorizeRoles(UserRole.DEPT_MANAGER), reportToGM);
router.get('/missing-logs', getMissingLogs);

export default router;
