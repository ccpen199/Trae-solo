const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '请输入用户名和密码' });
    }

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    let userInfo = null;
    if (user.role === 'admin') {
      userInfo = await db.get('SELECT * FROM admins WHERE user_id = ?', [user.id]);
    } else if (user.role === 'reader') {
      userInfo = await db.get('SELECT * FROM readers WHERE user_id = ?', [user.id]);
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        ...userInfo
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    let userInfo = null;

    if (user.role === 'admin') {
      userInfo = await db.get('SELECT * FROM admins WHERE user_id = ?', [user.id]);
    } else if (user.role === 'reader') {
      userInfo = await db.get('SELECT * FROM readers WHERE user_id = ?', [user.id]);
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      ...userInfo
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: '登出成功' });
});

module.exports = router;
