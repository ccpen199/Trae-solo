const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { username, email, password, nickname } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      const stmt = db.prepare('INSERT INTO users (username, email, password, nickname, is_guest) VALUES (?, ?, ?, ?, 0)');
      const result = stmt.run(username, email, hashedPassword, nickname || username);

      const token = jwt.sign(
        { userId: result.lastInsertRowid, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        data: {
          token,
          user: { id: result.lastInsertRowid, username, email, nickname: nickname || username }
        },
        message: '注册成功'
      });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
      }
      throw err;
    }
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/login', [
  body('username').exists(),
  body('password').exists()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误' });
    }

    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    
    if (!user || user.is_guest) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    bcrypt.compare(password, user.password, (err, valid) => {
      if (err || !valid) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
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
        },
        message: '登录成功'
      });
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/guest', (req, res) => {
  try {
    const { gender, birth_month, interests } = req.body;
    
    const stmt = db.prepare('INSERT INTO users (nickname, gender, birth_month, interests, is_guest) VALUES (?, ?, ?, ?, 1)');
    const result = stmt.run('游客用户', gender, birth_month, interests);

    const token = jwt.sign(
      { userId: result.lastInsertRowid, isGuest: true },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: result.lastInsertRowid, isGuest: true, gender, interests }
      },
      message: '游客登录成功'
    });
  } catch (error) {
    console.error('游客登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
