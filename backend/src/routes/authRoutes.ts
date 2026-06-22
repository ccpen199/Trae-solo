import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import upload from '../config/multer';

const router = express.Router();

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('用户名3-20字符'),
  body('email').isEmail().withMessage('请输入有效邮箱'),
  body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请输入有效手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], register);

router.post('/login', login);

router.get('/me', protect, getCurrentUser);

router.put('/profile', protect, upload.single('avatar'), updateProfile);

router.put('/password', protect, [
  body('oldPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], changePassword);

export default router;
