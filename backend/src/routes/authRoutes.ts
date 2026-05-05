import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

// 公开路由
router.post('/login', authController.loginValidation, authController.login);

// 需要认证的路由
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
