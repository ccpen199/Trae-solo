import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authenticate, authController.getCurrentUser);
router.put('/password', authenticate, authController.updatePassword);
router.put('/profile', authenticate, authController.updateProfile);

export default router;
