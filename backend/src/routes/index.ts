import { Router } from 'express';
import authRoutes from './auth';
import packageRoutes from './packages';
import taskRoutes from './tasks';
import settlementRoutes from './settlements';
import alertRoutes from './alerts';
import dashboardRoutes from './dashboard';
import branchRoutes from './branches';
import auditLogRoutes from './auditLogs';
import lockerStationRoutes from './lockerStations';
import customerGroupRoutes from './customerGroups';
import performanceRoutes from './performance';
import shopOrderRoutes from './shopOrders';

const router = Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/tasks', taskRoutes);
router.use('/settlements', settlementRoutes);
router.use('/alerts', alertRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/branches', branchRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/locker-stations', lockerStationRoutes);
router.use('/customer-groups', customerGroupRoutes);
router.use('/performance', performanceRoutes);
router.use('/shop-orders', shopOrderRoutes);

export default router;
