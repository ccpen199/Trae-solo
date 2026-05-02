const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: '登录失败' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { username, password, name, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = require('../utils/helpers').generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, hashedPassword, 'rider', name, phone, now, now);

    res.json({ message: '注册成功', userId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

module.exports = router;
