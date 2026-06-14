const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register/jobseeker', (req, res) => {
  const { phone, password, name, gender, age } = req.body;
  
  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({ error: '手机号已注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const insertUser = db.prepare('INSERT INTO users (phone, password, role) VALUES (?, ?, ?)');
    const userResult = insertUser.run(phone, hashedPassword, 'jobseeker');
    
    const insertJobseeker = db.prepare(`
      INSERT INTO jobseekers (user_id, name, gender, age, phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertJobseeker.run(userResult.lastInsertRowid, name, gender || '', age || 0, phone);

    const token = jwt.sign(
      { id: userResult.lastInsertRowid, phone, role: 'jobseeker' },
      process.env.JWT_SECRET || 'bluecollar_platform_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: userResult.lastInsertRowid, phone, role: 'jobseeker', name } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/register/employer', (req, res) => {
  const { phone, password, companyName, contactPerson } = req.body;
  
  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({ error: '手机号已注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const insertUser = db.prepare('INSERT INTO users (phone, password, role) VALUES (?, ?, ?)');
    const userResult = insertUser.run(phone, hashedPassword, 'employer');
    
    const insertEmployer = db.prepare(`
      INSERT INTO employers (user_id, company_name, contact_person, contact_phone)
      VALUES (?, ?, ?, ?)
    `);
    insertEmployer.run(userResult.lastInsertRowid, companyName, contactPerson, phone);

    const token = jwt.sign(
      { id: userResult.lastInsertRowid, phone, role: 'employer' },
      process.env.JWT_SECRET || 'bluecollar_platform_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: userResult.lastInsertRowid, phone, role: 'employer', companyName } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    let profile = null;
    if (user.role === 'jobseeker') {
      profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(user.id);
    } else if (user.role === 'employer') {
      profile = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(user.id);
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'bluecollar_platform_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, phone: user.phone, role: user.role, profile } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'jobseeker') {
      profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    } else if (req.user.role === 'employer') {
      profile = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
    }
    res.json({ user: { ...req.user, profile } });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

module.exports = router;
