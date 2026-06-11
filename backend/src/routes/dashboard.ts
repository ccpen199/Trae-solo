import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', authMiddleware, (req, res) => dashboardController.getStats(req, res));

export default router;
