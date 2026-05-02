import { Router } from 'express';
import * as statisticsController from '../controllers/statisticsController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate);

router.get('/dashboard', statisticsController.getDashboardStatistics);

router.use(requireRole([UserRole.ADMIN]));

router.get('/exam/:examId', statisticsController.getExamStatistics);
router.get('/exam/:examId/export', statisticsController.exportExamResults);
router.get('/exam/:examId/knowledge-points', statisticsController.getKnowledgePointAnalysis);

export default router;
