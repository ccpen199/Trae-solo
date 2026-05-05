import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder
} from '../controllers/orderController';

const router = Router();

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getMyOrders);
router.get('/:id', authenticateToken, getOrderById);
router.post('/:id/cancel', authenticateToken, cancelOrder);

export default router;
