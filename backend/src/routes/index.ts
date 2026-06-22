import { Router } from 'express';
import authRoutes from './auth.routes';
import riderRoutes from './rider.routes';
import orderRoutes from './order.routes';
import taskRoutes from './task.routes';
import trackingRoutes from './tracking.routes';
import auditRoutes from './audit.routes';
import adminRoutes from './admin.routes';
import apiRoutes from './api.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rider', riderRoutes);
router.use('/orders', orderRoutes);
router.use('/tasks', taskRoutes);
router.use('/tracking', trackingRoutes);
router.use('/audit', auditRoutes);
router.use('/admin', adminRoutes);
router.use('/external', apiRoutes);

export default router;
