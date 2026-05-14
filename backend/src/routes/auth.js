const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/init');
const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { username, email, password, nickname } = req.body;

    if (!username || !email || !password) {
      return res.json({ success: false, message: '请填写完整信息' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.json({ success: false, message: '用户名或邮箱已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const insertUser = db.prepare('INSERT INTO users (username, email, password, nickname) VALUES (?, ?, ?, ?)');
    const result = insertUser.run(username, email, hashedPassword, nickname || username);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: { id: result.lastInsertRowid, username, email, nickname: nickname || username }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: '请填写用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ success: false, message: '密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/profile', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ success: false, message: '未登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.json({ success: false, message: '登录已过期' });
    }

    const user = db.prepare('SELECT id, username, email, nickname, avatar, bio, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.json({ success: false, message: '获取用户信息失败' });
    }
    res.json({ success: true, data: user });
  });
});

module.exports = router;
