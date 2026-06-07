import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', authenticateToken, AuthController.logout);

export default router;
