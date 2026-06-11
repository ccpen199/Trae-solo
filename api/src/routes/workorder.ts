import { Router } from 'express';
import { getWorkOrders, getWorkOrderDetail, createWorkOrder, updateWorkOrderStatus, evaluateWorkOrder } from '../controllers/workorder.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware(), getWorkOrders);
router.get('/:id', authMiddleware(), getWorkOrderDetail);
router.post('/', authMiddleware(['owner', 'tenant']), createWorkOrder);
router.patch('/:id/status', authMiddleware(), updateWorkOrderStatus);
router.post('/:id/evaluate', authMiddleware(['owner', 'tenant']), evaluateWorkOrder);

export default router;
