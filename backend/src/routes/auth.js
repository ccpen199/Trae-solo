const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getQuery, runQuery } = require('../database');

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '请输入手机号和密码' });
    }

    const user = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);

    if (!user) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          username: user.username
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '请输入手机号和密码' });
    }

    const existingUser = await getQuery('SELECT id FROM users WHERE phone = ?', [phone]);

    if (existingUser) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultNickname = nickname || `用户${phone.slice(-4)}`;

    const result = await runQuery(
      'INSERT INTO users (phone, password, nickname, username) VALUES (?, ?, ?, ?)',
      [phone, hashedPassword, defaultNickname, phone]
    );

    const token = jwt.sign(
      { id: result.lastID, phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
        id: result.lastID,
        phone,
        nickname: defaultNickname,
        avatar: null,
        username: phone
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: '请输入手机号' });
    }
    res.json({ success: true, message: '验证码已发送', data: { code: '123456' } });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
