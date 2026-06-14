const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { generateToken, authenticateToken } = require('../middleware');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const token = generateToken(user.id);
  
  let profile = null;
  if (user.role === 'jobseeker') {
    profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(user.id);
  } else if (user.role === 'company') {
    profile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
  }

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      profile
    }
  });
});

router.post('/register', (req, res) => {
  const { email, password, role, name, phone } = req.body;
  
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (!['jobseeker', 'company'].includes(role)) {
    return res.status(400).json({ error: '角色类型无效' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(400).json({ error: '该邮箱已被注册' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const result = db.prepare('INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)').run(
    email, hashedPassword, role, name, phone || null
  );

  const userId = result.lastInsertRowid;

  if (role === 'jobseeker') {
    db.prepare('INSERT INTO jobseekers (user_id) VALUES (?)').run(userId);
  } else if (role === 'company') {
    db.prepare('INSERT INTO companies (user_id, company_name) VALUES (?, ?)').run(userId, name);
  }

  const token = generateToken(userId);

  res.status(201).json({
    token,
    user: {
      id: userId,
      email,
      role,
      name,
      phone
    }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  
  let profile = null;
  if (user.role === 'jobseeker') {
    profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(user.id);
    if (profile) {
      profile.skills = profile.skills ? JSON.parse(profile.skills) : [];
      profile.languages = profile.languages ? JSON.parse(profile.languages) : [];
      profile.ftz_preferences = profile.ftz_preferences ? JSON.parse(profile.ftz_preferences) : {};
    }
  } else if (user.role === 'company') {
    profile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      profile
    }
  });
});

module.exports = router;
