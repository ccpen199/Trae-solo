import { Router } from 'express';
import { orderController, createOrderSchema } from '../controllers';
import { authMiddleware, validate } from '../middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getOrderList);
router.get('/current', orderController.getCurrentOrder);
router.get('/:orderId', orderController.getOrderDetail);
router.post('/:orderId/start', orderController.startCharging);
router.post('/:orderId/stop', orderController.stopCharging);

export default router;
