import { Router } from 'express';
import { routeController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

router.post('/plan', routeController.planRoute);

router.use(authMiddleware);
router.get('/', routeController.getRoutePlans);
router.post('/', routeController.saveRoutePlan);
router.get('/:planId', routeController.getRoutePlanDetail);
router.delete('/:planId', routeController.deleteRoutePlan);

export default router;
