import { Router } from 'express';
import * as gradingController from '../controllers/gradingController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate);

router.use(requireRole([UserRole.ADMIN, UserRole.GRADER]));

router.get('/pending', gradingController.getPendingGradings);
router.get('/details/:userExamId', gradingController.getGradingDetails);
router.get('/statistics', gradingController.getGradingStatistics);
router.get('/my-tasks', gradingController.getMyGradingTasks);

router.post('/grade/:userAnswerId', gradingController.gradeAnswer);
router.post('/batch-grade', gradingController.batchGrade);
router.post('/assign', gradingController.assignGradingTask);

export default router;
