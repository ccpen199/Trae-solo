import { Router } from 'express';
import {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
} from '../controllers/trainingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getTrainings);
router.get('/:id', authenticateToken, getTrainingById);
router.post('/', authenticateToken, requireAdmin, createTraining);
router.put('/:id', authenticateToken, requireAdmin, updateTraining);
router.delete('/:id', authenticateToken, requireAdmin, deleteTraining);

export default router;
