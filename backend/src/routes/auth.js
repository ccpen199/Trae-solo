const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, password, nickname } = req.body;
    
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    
    const result = db.prepare(`
      INSERT INTO users (username, password, nickname, avatar)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, nickname || username, avatar);

    const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const user = db.prepare('SELECT id, username, nickname, avatar, is_admin FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ success: true, data: { user: userWithoutPassword, token } });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
