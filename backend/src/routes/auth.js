const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nickname = username;

    const stmt = db.prepare('INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, email, hashedPassword, nickname);

    const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const user = db.prepare('SELECT id, username, email, nickname, avatar, bio FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: { user, token }, message: '注册成功' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    if (!user) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;

    res.json({ success: true, data: { user: userWithoutPassword, token }, message: '登录成功' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { nickname, avatar, bio, gender } = req.body;
    
    const stmt = db.prepare(`
      UPDATE users 
      SET nickname = ?, avatar = ?, bio = ?, gender = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(nickname || req.user.nickname, avatar || req.user.avatar, bio || req.user.bio, gender || req.user.gender, req.user.id);

    const user = db.prepare('SELECT id, username, email, nickname, avatar, bio, gender FROM users WHERE id = ?').get(req.user.id);

    res.json({ success: true, data: user, message: '更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
