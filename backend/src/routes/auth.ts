import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  authController.login
);

router.get('/me', authenticate, authController.getCurrentUser);

router.put(
  '/profile',
  authenticate,
  authController.updateProfile
);

router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6个字符'),
  ],
  authController.changePassword
);

export default router;
