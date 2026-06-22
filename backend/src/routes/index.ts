import { Router } from 'express';
import authRoutes from './auth.routes.js';
import riderRoutes from './rider.routes.js';
import orderRoutes from './order.routes.js';
import taskRoutes from './task.routes.js';
import trackingRoutes from './tracking.routes.js';
import auditRoutes from './audit.routes.js';
import adminRoutes from './admin.routes.js';
import apiRoutes from './api.routes.js';

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
