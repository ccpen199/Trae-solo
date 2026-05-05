import { Router } from 'express';
import { register, login, getCurrentUser, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);

export default router;
