import { Router } from 'express';
import userRoutes from './userRoutes';
import stationRoutes from './stationRoutes';
import orderRoutes from './orderRoutes';
import communityRoutes from './communityRoutes';
import v2gRoutes from './v2gRoutes';
import faultRoutes from './faultRoutes';
import routePlanRoutes from './routePlanRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/users', userRoutes);
router.use('/stations', stationRoutes);
router.use('/orders', orderRoutes);
router.use('/community', communityRoutes);
router.use('/v2g', v2gRoutes);
router.use('/faults', faultRoutes);
router.use('/route-plans', routePlanRoutes);

export default router;
