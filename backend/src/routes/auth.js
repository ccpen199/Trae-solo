const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, username]
    );

    await db.run('INSERT INTO user_settings (user_id) VALUES (?)', [result.lastID]);

    const token = jwt.sign({ userId: result.lastID, username }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: result.lastID, username, email, nickname: username, isVip: 0 }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname, isVip: user.is_vip }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ user: null });
    }

    const user = await db.get('SELECT id, username, email, nickname, avatar, is_vip FROM users WHERE id = ?', [req.user.userId]);
    if (!user) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        isVip: user.is_vip
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
