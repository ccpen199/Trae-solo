import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', authMiddleware, requireRole('admin'), (req, res) => authController.register(req, res));
router.get('/me', authMiddleware, (req, res) => authController.getMe(req, res));

export default router;
