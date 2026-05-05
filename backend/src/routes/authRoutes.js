const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { verifyToken } = require('../middleware/auth');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json({
      success: true,
      data: result,
      message: '登录成功',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', verifyToken, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await authService.logout(token);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', verifyToken, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;