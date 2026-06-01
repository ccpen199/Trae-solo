import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

router.get('/summary', authenticateToken, (req, res) => dashboardController.getSummary(req, res));
router.get('/trend', authenticateToken, (req, res) => dashboardController.getTrend(req, res));
router.get('/structure', authenticateToken, (req, res) => dashboardController.getStructure(req, res));
router.get('/monthly-review/:year/:month', authenticateToken, (req, res) => dashboardController.getMonthlyReview(req, res));

router.get('/admin/stats', authenticateToken, requireRole(['admin']), (req, res) => dashboardController.getAdminStats(req, res));
router.get('/admin/logs', authenticateToken, requireRole(['admin']), (req, res) => dashboardController.getOperationLogs(req, res));

export default router;
