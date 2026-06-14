const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度需在3-20字符之间'),
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').isIn(['landlord', 'tenant']).withMessage('无效的用户角色')
], authController.register);

router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名或手机号'),
  body('password').notEmpty().withMessage('请输入密码')
], authController.login);

router.get('/me', authenticateToken, authController.getCurrentUser);

router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
