const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');

router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败',
        errors: errors.array(),
      });
    }

    const { username, password } = req.body;
    const result = userService.login(username, password);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '已退出登录',
  });
});

router.get('/roles', (req, res) => {
  try {
    const roles = userService.getRoleList();
    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/current', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '未登录',
    });
  }

  const user = userService.getUserById(parseInt(userId));
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户不存在',
    });
  }

  const { ROLE_LABELS } = require('../utils/constants');
  res.json({
    success: true,
    data: {
      ...user,
      roleLabel: ROLE_LABELS[user.role],
    },
  });
});

module.exports = router;
