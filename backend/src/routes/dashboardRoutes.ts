import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, dashboardController.getDashboardStats);
router.get('/trend', authMiddleware, dashboardController.getTrendData);

export default router;
