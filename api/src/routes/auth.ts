import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware(), getCurrentUser);

export default router;
