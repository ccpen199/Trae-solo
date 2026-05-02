import { Router } from 'express';
import { AuthController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', (req, res, next) => authController.login(req, res, next));

router.get('/me', authMiddleware, (req, res, next) =>
  authController.getCurrentUser(req, res, next)
);

router.get('/users', authMiddleware, (req, res, next) =>
  authController.getUserList(req, res, next)
);

router.post('/change-password', authMiddleware, (req, res, next) =>
  authController.changePassword(req, res, next)
);

export default router;
