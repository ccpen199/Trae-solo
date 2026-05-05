import { Router } from 'express';
import {
  getRewardPunishments,
  getRewardPunishmentById,
  createRewardPunishment,
  updateRewardPunishment,
  deleteRewardPunishment,
} from '../controllers/rewardPunishmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getRewardPunishments);
router.get('/:id', authenticateToken, getRewardPunishmentById);
router.post('/', authenticateToken, requireAdmin, createRewardPunishment);
router.put('/:id', authenticateToken, requireAdmin, updateRewardPunishment);
router.delete('/:id', authenticateToken, requireAdmin, deleteRewardPunishment);

export default router;
