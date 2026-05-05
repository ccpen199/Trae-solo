import { Router } from 'express';
import { login, getCurrentUser, createAdmin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/init-admin', createAdmin);

export default router;
