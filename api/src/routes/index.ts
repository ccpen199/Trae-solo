import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './tasks.routes';
import orderRoutes from './orders.routes';
import waybillRoutes from './waybill.routes';
import messageRoutes from './messages.routes';
import financeRoutes from './finance.routes';
import courierRoutes from './couriers.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/orders', orderRoutes);
router.use('/waybill', waybillRoutes);
router.use('/messages', messageRoutes);
router.use('/finance', financeRoutes);
router.use('/couriers', courierRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

