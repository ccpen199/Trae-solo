import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import deviceRoutes from './device';
import transactionRoutes from './transaction';
import paymentRoutes from './payment';
import investorRoutes from './investor';
import operatorRoutes from './operator';
import iotRoutes from './iot';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/device', deviceRoutes);
router.use('/transaction', transactionRoutes);
router.use('/payment', paymentRoutes);
router.use('/investor', investorRoutes);
router.use('/operator', operatorRoutes);
router.use('/iot', iotRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
