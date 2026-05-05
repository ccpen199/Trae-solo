const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// 注册
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度为3-20个字符'),
  body('password').isLength({ min: 6, max: 20 }).withMessage('密码长度为6-20个字符'),
], validate, authController.register);

// 登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
], validate, authController.login);

// 获取当前用户信息
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
