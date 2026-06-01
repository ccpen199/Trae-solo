import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';

const router = Router();

router.post('/', orderController.createOrder);
router.get('/user/:userId', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderDetail);
router.post('/:orderId/confirm', orderController.confirmOrder);
router.post('/:orderId/cancel', orderController.cancelOrder);

export default router;
