import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/apply-reviewer', authController.applyReviewer);
router.post('/apply-brand', authController.applyBrand);
router.get('/me', requireAuth, authController.getCurrentUser);

export default router;
