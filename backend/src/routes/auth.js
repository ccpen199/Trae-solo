const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../models/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, phone, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?').get(username, phone || null);
    if (existingUser) {
      return res.status(400).json({ error: '用户名或手机号已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.prepare('INSERT INTO users (username, password_hash, phone, role) VALUES (?, ?, ?, ?)').run(username, passwordHash, phone || null, role);

    const userId = result.lastInsertRowid;
    const token = generateToken(userId);

    const user = db.prepare('SELECT id, username, phone, role, created_at FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      message: '注册成功',
      token,
      user
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username);
    if (!user) {
      return res.status(401).json({ error: '账号不存在，请检查用户名或注册新账号' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '密码错误，请重试或点击"忘记密码"' });
    }

    const token = generateToken(user.id);

    const userInfo = db.prepare('SELECT id, username, phone, role, created_at FROM users WHERE id = ?').get(user.id);

    res.json({
      message: '登录成功',
      token,
      user: userInfo
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: '退出成功' });
});

module.exports = router;
