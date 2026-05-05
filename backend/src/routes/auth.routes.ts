import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/password', authenticateToken, authController.changePassword);

export default router;
