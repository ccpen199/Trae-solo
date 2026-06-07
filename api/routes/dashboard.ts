import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', authMiddleware, requireRole('admin', 'property'), dashboardController.stats.bind(dashboardController));
router.get('/quick-stats', authMiddleware, requireRole('admin', 'property'), dashboardController.quickStats.bind(dashboardController));
router.get('/ticket-trend', authMiddleware, requireRole('admin', 'property'), dashboardController.ticketTrend.bind(dashboardController));
router.get('/staff-performance', authMiddleware, requireRole('admin', 'property'), dashboardController.staffPerformance.bind(dashboardController));
router.get('/building-stats', authMiddleware, requireRole('admin', 'property'), dashboardController.buildingStats.bind(dashboardController));
router.get('/fee-stats', authMiddleware, requireRole('admin', 'property'), dashboardController.feeStats.bind(dashboardController));
router.get('/access-logs', authMiddleware, requireRole('admin', 'property'), dashboardController.accessLogs.bind(dashboardController));
router.get('/system-health', authMiddleware, requireRole('admin'), dashboardController.systemHealth.bind(dashboardController));
router.get('/request-logs', authMiddleware, requireRole('admin'), dashboardController.requestLogs.bind(dashboardController));
router.get('/request-stats', authMiddleware, requireRole('admin'), dashboardController.requestStats.bind(dashboardController));

export default router;
