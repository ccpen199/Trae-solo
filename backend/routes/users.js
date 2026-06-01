const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.prepare('SELECT id, phone, name, avatar, balance, created_at FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.error('用户不存在', null, 404);
    }
    
    res.success(user);
  } catch (err) {
    res.error('获取用户信息失败', err.message);
  }
});

router.get('/:userId/balance', (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.error('用户不存在', null, 404);
    }
    
    res.success({ balance: user.balance });
  } catch (err) {
    res.error('获取余额失败', err.message);
  }
});

router.post('/:userId/verify-password', (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.error('请输入支付密码');
    }
    
    const user = db.prepare('SELECT pay_password FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.error('用户不存在', null, 404);
    }
    
    const isValid = user.pay_password === password;
    res.success({ valid: isValid });
  } catch (err) {
    res.error('验证密码失败', err.message);
  }
});

router.post('/:userId/reset-password', (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.error('密码长度至少6位');
    }
    
    const result = db.prepare('UPDATE users SET pay_password = ? WHERE id = ?').run(newPassword, userId);
    
    if (result.changes === 0) {
      return res.error('用户不存在', null, 404);
    }
    
    res.success(null, '密码重置成功');
  } catch (err) {
    res.error('重置密码失败', err.message);
  }
});

module.exports = router;
