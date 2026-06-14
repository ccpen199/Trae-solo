import { Router } from 'express';
import authRoutes from './auth';
import packageRoutes from './packages';
import taskRoutes from './tasks';
import settlementRoutes from './settlements';
import alertRoutes from './alerts';
import dashboardRoutes from './dashboard';

const router = Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/tasks', taskRoutes);
router.use('/settlements', settlementRoutes);
router.use('/alerts', alertRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
