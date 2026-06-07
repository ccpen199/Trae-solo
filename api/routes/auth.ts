import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));
router.get('/me', authMiddleware, authController.me.bind(authController));
router.post('/change-password', authMiddleware, authController.changePassword.bind(authController));

export default router;
