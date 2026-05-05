import express from 'express';
import { login, getCurrentUser, getUsersByRole } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.get('/users-by-role', authenticate, getUsersByRole);

export default router;
