import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateCurrentUserPassword,
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.put('/change-password', authenticateToken, updateCurrentUserPassword);
router.get('/', authenticateToken, requireAdmin, getUsers);
router.get('/:id', authenticateToken, requireAdmin, getUserById);
router.post('/', authenticateToken, requireAdmin, createUser);
router.put('/:id', authenticateToken, requireAdmin, updateUser);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
