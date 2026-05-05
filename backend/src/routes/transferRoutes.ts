import { Router } from 'express';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  deleteTransfer,
} from '../controllers/transferController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getTransfers);
router.get('/:id', authenticateToken, getTransferById);
router.post('/', authenticateToken, requireAdmin, createTransfer);
router.put('/:id', authenticateToken, requireAdmin, updateTransfer);
router.delete('/:id', authenticateToken, requireAdmin, deleteTransfer);

export default router;
