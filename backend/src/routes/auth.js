const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 2, max: 50 }).withMessage('用户名长度必须在2-50个字符之间'),
  body('password').isLength({ min: 6, max: 255 }).withMessage('密码长度至少6个字符'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确')
], authController.register);

router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], authController.login);

router.get('/me', authMiddleware, authController.getCurrentUser);

router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
