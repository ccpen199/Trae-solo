import { Router } from 'express';
import { v2gController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

router.use(authMiddleware);

router.get('/strategies', v2gController.getStrategies);
router.post('/strategies', v2gController.createStrategy);
router.get('/strategies/:strategyId', v2gController.getStrategyDetail);
router.put('/strategies/:strategyId', v2gController.updateStrategy);
router.delete('/strategies/:strategyId', v2gController.deleteStrategy);
router.post('/strategies/:strategyId/toggle', v2gController.toggleStrategy);
router.post('/enable', v2gController.enableV2G);

export default router;
