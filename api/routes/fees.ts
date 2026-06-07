import express from 'express';
import { FeeController } from '../controllers/FeeController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, FeeController.getFeeBills);
router.get('/stats', authMiddleware, FeeController.getFeeStats);
router.get('/:id', authMiddleware, FeeController.getFeeBillById);
router.post('/', authMiddleware, requireRole('admin', 'property'), FeeController.createFeeBill);
router.put('/:id', authMiddleware, requireRole('admin', 'property'), FeeController.updateFeeBill);
router.post('/:id/pay', authMiddleware, FeeController.payFeeBill);

export default router;
