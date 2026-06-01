const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, execute } = require('../database');

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ code: 1, message: '请输入手机号和密码' });
    }
    
    const user = await queryOne('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      return res.status(400).json({ code: 1, message: '用户不存在' });
    }
    
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(400).json({ code: 1, message: '密码错误' });
    }
    
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'movie-ticket-secret-key-2024',
      { expiresIn: '7d' }
    );
    
    delete user.password;
    res.json({ 
      code: 0, 
      data: { token, user }, 
      message: '登录成功' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ code: 1, message: '请输入手机号和密码' });
    }
    
    const existingUser = await queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json({ code: 1, message: '该手机号已注册' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await execute(
      'INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)',
      [phone, hashedPassword, nickname || `用户${phone.slice(-4)}`]
    );
    
    const user = await queryOne('SELECT id, phone, nickname FROM users WHERE id = ?', [result.lastID]);
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'movie-ticket-secret-key-2024',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      code: 0, 
      data: { token, user }, 
      message: '注册成功' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ code: 0, message: '退出成功' });
});

module.exports = router;
