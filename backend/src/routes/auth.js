const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const existingUser = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (username, password, nickname, phone) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, nickname || username, phone || '']
    );

    const token = jwt.sign({ userId: result.lastID }, process.env.JWT_SECRET || 'yiyichong_secret_key', { expiresIn: '7d' });
    const user = await get('SELECT id, username, nickname, avatar, role FROM users WHERE id = ?', [result.lastID]);

    res.json({ success: true, data: { token, user }, message: '注册成功' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'yiyichong_secret_key', { expiresIn: '7d' });
    const userInfo = { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role };

    res.json({ success: true, data: { token, user: userInfo }, message: '登录成功' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { nickname, avatar, phone, email } = req.body;
    await run(
      `UPDATE users SET nickname = ?, avatar = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nickname || req.user.nickname, avatar || req.user.avatar, phone || '', email || '', req.user.id]
    );

    const user = await get('SELECT id, username, nickname, avatar, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, data: user, message: '更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

module.exports = router;
