import { Router } from 'express';
import { userController, registerSchema, loginSchema, updateUserSchema } from '../controllers';
import { authMiddleware, validate } from '../middleware';

const router = Router();

router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validate(updateUserSchema), userController.updateProfile);
router.get('/profile/stats', authMiddleware, userController.getUserProfile);

export default router;
