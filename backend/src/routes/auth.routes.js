const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');

// 公开路由 - 登录
router.post('/login', authController.login);

// 需要认证的路由
router.use(authenticateJWT);

// 登出
router.post('/logout', authController.logout);

// 获取当前用户信息
router.get('/me', authController.getCurrentUser);

// 修改密码
router.post('/change-password', authController.changePassword);

module.exports = router;
