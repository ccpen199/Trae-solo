import { Router } from 'express';
import { MonitorController } from '../controllers/MonitorController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authenticateToken, requireRole('admin', 'operator'), MonitorController.getOverview);
router.get('/bottlenecks', authenticateToken, requireRole('admin', 'operator'), MonitorController.getBottlenecks);
router.get('/trend', authenticateToken, requireRole('admin', 'operator'), MonitorController.getDailyTrend);
router.get('/department-stats', authenticateToken, requireRole('admin', 'operator'), MonitorController.getDepartmentStats);
router.get('/api-resources', authenticateToken, requireRole('admin', 'operator'), MonitorController.getApiResources);
router.get('/api-resources/:id/call-logs', authenticateToken, requireRole('admin', 'operator'), MonitorController.getApiCallLogs);

export default router;
