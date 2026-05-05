import { Router } from 'express';
import { login, register, getCurrentUser, changePassword } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateJWT, getCurrentUser);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
