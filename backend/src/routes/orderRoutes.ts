import { Router } from 'express';
import { getOrders, getOrderById, createOrder, assignOrder, autoDispatchOrder, acceptOrder, pickupOrder, deliverOrder } from '../controllers/orderController';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.post('/:id/assign', assignOrder);
router.post('/:id/auto-dispatch', autoDispatchOrder);
router.post('/:id/accept', acceptOrder);
router.post('/:id/pickup', pickupOrder);
router.post('/:id/deliver', deliverOrder);

export default router;
