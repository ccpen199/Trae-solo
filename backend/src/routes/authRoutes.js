const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  authController.login
);

router.post('/logout', authenticateToken, authController.logout);

router.get('/me', authenticateToken, authController.getCurrentUser);

router.post(
  '/change-password',
  authenticateToken,
  [
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword').notEmpty().withMessage('新密码不能为空')
      .isLength({ min: 6 }).withMessage('新密码长度至少6位')
  ],
  authController.changePassword
);

module.exports = router;
