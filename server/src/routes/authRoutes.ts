import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import {
  login,
  loginValidation,
  getCurrentUser,
  changePassword,
  changePasswordValidation,
  listUsers,
} from '../controllers/authController';
import { UserRole } from '../config';

const router = Router();

router.post('/login', loginValidation, login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.get('/users', authenticateToken, requireRoles(UserRole.MANAGER, UserRole.TEAM_LEADER), listUsers);

export default router;
