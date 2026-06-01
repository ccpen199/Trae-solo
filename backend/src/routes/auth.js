const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'hiyou-movie-secret-key-2024';

router.post('/register', (req, res) => {
  try {
    const { phone, password, nickname, username, email } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
    }
    
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (phone, password, nickname, username, email, is_vip)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(phone, hashedPassword, nickname || '用户' + phone.slice(-4), username || phone, email);
    
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
    
    const user = db.prepare('SELECT id, phone, nickname, avatar, is_vip FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ 
      success: true, 
      message: '注册成功',
      data: { user, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }
    
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '手机号或密码错误' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...safeUser } = user;
    
    res.json({ 
      success: true, 
      message: '登录成功',
      data: { user: safeUser, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '退出成功' });
});

module.exports = router;
