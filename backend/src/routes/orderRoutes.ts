import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, orderController.getOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);

router.post('/', authMiddleware, orderController.createOrderValidation, orderController.createOrder);
router.post('/:id/pay', authMiddleware, orderController.payOrder);
router.post('/:id/deliver', authMiddleware, orderController.deliverOrder);
router.post('/:id/confirm', authMiddleware, orderController.confirmOrder);
router.post('/:id/cancel', authMiddleware, orderController.cancelOrder);
router.post('/:id/exception', authMiddleware, orderController.raiseException);

export default router;
