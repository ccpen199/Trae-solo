const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.get(
      `SELECT u.*, r.code as role_code, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ?`,
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ error: '用户已被禁用' });
    }

    const token = generateToken(user.id);

    db.update(
      'users',
      { last_login_at: require('../services/stateMachine').getNow() },
      'id = ?',
      [user.id]
    );

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_code: user.role_code,
      role_name: user.role_name,
      merchant_id: user.merchant_id,
    };

    res.json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败', message: err.message });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.get(
      `SELECT u.*, r.code as role_code, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    const permissions = db.exec(
      `SELECT p.code, p.name, p.module 
       FROM role_permissions rp 
       JOIN permissions p ON rp.permission_id = p.id 
       WHERE rp.role_id = ?`,
      [user.role_id]
    );

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_code: user.role_code,
      role_name: user.role_name,
      merchant_id: user.merchant_id,
      permissions,
    };

    res.json({ success: true, user: userResponse });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: '已登出' });
});

module.exports = router;
