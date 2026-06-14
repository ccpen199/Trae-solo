const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { 
    username, password, phone, email, user_type, real_name,
    id_card, skills, location, latitude, longitude, available_hours,
    company_name, business_license, contact_name, contact_phone, qualification
  } = req.body;
  
  if (!username || !password || !user_type) {
    return res.status(400).json({ error: '用户名、密码和用户类型为必填项' });
  }
  
  if (!['student', 'homemaker', 'parttime', 'employer'].includes(user_type)) {
    return res.status(400).json({ error: '无效的用户类型' });
  }
  
  if (user_type === 'employer' && !company_name) {
    return res.status(400).json({ error: '请填写企业名称' });
  }
  
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ? OR email = ?').get(username, phone || '', email || '');
  if (existingUser) {
    return res.status(400).json({ error: '用户名、手机号或邮箱已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const skillsJson = skills ? JSON.stringify(skills) : null;
  const availableHoursJson = available_hours ? JSON.stringify(available_hours) : null;
  
  const insertUser = db.prepare(`
    INSERT INTO users (
      username, password, phone, email, user_type, real_name, 
      id_card, skills, location, latitude, longitude, available_hours,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertUser.run(
    username, hashedPassword, phone || null, email || null, user_type, real_name || null,
    id_card || null, skillsJson, location || null, 
    latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null, 
    availableHoursJson,
    'active'
  );
  
  if (user_type === 'employer') {
    const insertEmployer = db.prepare(`
      INSERT INTO employers (
        user_id, company_name, business_license, contact_name, contact_phone, qualification
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertEmployer.run(
      result.lastInsertRowid, 
      company_name || '', 
      business_license || null,
      contact_name || real_name || '', 
      contact_phone || phone || '',
      qualification || null
    );
  }
  
  const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  let employerInfo = null;
  if (user_type === 'employer') {
    employerInfo = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(result.lastInsertRowid);
  }
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      user_type: user.user_type,
      real_name: user.real_name,
      phone: user.phone,
      email: user.email,
      id_verified: user.id_verified,
      skills: user.skills ? JSON.parse(user.skills) : [],
      location: user.location,
      credit_score: user.credit_score,
      employer: employerInfo
    }
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填项' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ? OR email = ?').get(username, username, username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }
  
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  let employerInfo = null;
  if (user.user_type === 'employer') {
    employerInfo = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(user.id);
  }
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      user_type: user.user_type,
      real_name: user.real_name,
      phone: user.phone,
      email: user.email,
      id_verified: user.id_verified,
      avatar: user.avatar,
      skills: user.skills,
      location: user.location,
      credit_score: user.credit_score,
      employer: employerInfo
    }
  });
});

router.get('/profile', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  let employerInfo = null;
  if (user.user_type === 'employer') {
    employerInfo = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(user.id);
  }
  
  res.json({
    id: user.id,
    username: user.username,
    user_type: user.user_type,
    real_name: user.real_name,
    phone: user.phone,
    email: user.email,
    id_verified: user.id_verified,
    avatar: user.avatar,
    skills: user.skills ? JSON.parse(user.skills) : [],
    location: user.location,
    latitude: user.latitude,
    longitude: user.longitude,
    available_hours: user.available_hours ? JSON.parse(user.available_hours) : null,
    credit_score: user.credit_score,
    status: user.status,
    created_at: user.created_at,
    employer: employerInfo
  });
});

router.put('/profile', authenticate, (req, res) => {
  const { real_name, phone, email, avatar, skills, location, latitude, longitude, available_hours } = req.body;
  
  const updateUser = db.prepare(`
    UPDATE users SET 
      real_name = COALESCE(?, real_name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      avatar = COALESCE(?, avatar),
      skills = COALESCE(?, skills),
      location = COALESCE(?, location),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      available_hours = COALESCE(?, available_hours),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  updateUser.run(
    real_name || null,
    phone || null,
    email || null,
    avatar || null,
    skills ? JSON.stringify(skills) : null,
    location || null,
    latitude || null,
    longitude || null,
    available_hours ? JSON.stringify(available_hours) : null,
    req.user.id
  );
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    id: user.id,
    username: user.username,
    user_type: user.user_type,
    real_name: user.real_name,
    phone: user.phone,
    email: user.email,
    id_verified: user.id_verified,
    avatar: user.avatar,
    skills: user.skills ? JSON.parse(user.skills) : [],
    location: user.location,
    credit_score: user.credit_score
  });
});

module.exports = router;
