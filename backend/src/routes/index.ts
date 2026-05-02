import { Router } from 'express';
import authRoutes from './auth';
import propertyRoutes from './properties';
import orderRoutes from './orders';
import cleaningRoutes from './cleaning';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/orders', orderRoutes);
router.use('/cleaning', cleaningRoutes);

export default router;
