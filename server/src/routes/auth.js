const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 1) {
    return res.status(401).json({ error: '账号已被禁用' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  const merchant = user.role === 'merchant' 
    ? db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(user.id) 
    : null;

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      real_name: user.real_name,
      avatar: user.avatar,
      city: user.city,
      merchant_id: merchant?.id
    }
  });
});

router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['couple', 'merchant'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, role, real_name, phone, city } = req.body;

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, role, real_name, phone, city) VALUES (?, ?, ?, ?, ?, ?)')
    .run(username, hashedPassword, role, real_name, phone, city);

  if (role === 'merchant') {
    db.prepare('INSERT INTO merchants (user_id, company_name, category, description, city, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(result.lastInsertRowid, req.body.company_name || '', req.body.category || 'photography', '', city || '', real_name || '', phone || '');
  }

  const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      role,
      real_name,
      city
    }
  });
});

router.get('/profile', auth(), (req, res) => {
  const user = req.user;
  const merchant = user.role === 'merchant'
    ? db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(user.id)
    : null;
  
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    real_name: user.real_name,
    avatar: user.avatar,
    phone: user.phone,
    email: user.email,
    city: user.city,
    merchant
  });
});

router.put('/profile', auth(), (req, res) => {
  const { real_name, phone, email, avatar, city } = req.body;
  db.prepare('UPDATE users SET real_name = ?, phone = ?, email = ?, avatar = ?, city = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(real_name, phone, email, avatar, city, req.user.id);
  
  res.json({ message: '更新成功' });
});

module.exports = router;
