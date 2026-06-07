const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/init');
const { verifyToken, requireRole, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { phone, password, name, role } = req.body;
  if (!phone || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['requester', 'courier'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role, must be requester or courier' });
  }

  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(409).json({ error: 'Phone already registered' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO users (id, phone, password_hash, name, role, credit_score, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 100, 'active', ?, ?)
  `).run(id, phone, hash, name, role, now, now);

  if (role === 'courier') {
    db.prepare(`
      INSERT INTO courier_profiles (id, user_id, real_name, id_number, id_card_photo, status, latitude, longitude, is_online, total_orders, completed_orders, avg_rating, fulfillment_rate, current_order_id, created_at, updated_at)
      VALUES (?, ?, ?, NULL, NULL, 'pending', NULL, NULL, 0, 0, 0, 5.0, 1.0, NULL, ?, ?)
    `).run(uuidv4(), id, name, now, now);
  }

  const token = jwt.sign(
    { id, phone, name, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id, phone, name, role, credit_score: 100, status: 'active' }
  });
});

const usernameAliases = {
  admin: { phone: '13800000001', role: 'admin' },
  platform: { phone: '13800000001', role: 'admin' },
  ops: { phone: '13800000001', role: 'admin' },
  requester: { phone: '13800000010', role: 'requester' },
  user: { phone: '13800000010', role: 'requester' },
  courier: { phone: '13800000020', role: 'courier' },
  runner: { phone: '13800000020', role: 'courier' },
};

router.post('/login', (req, res) => {
  const { phone, username, password } = req.body;

  let lookupPhone = phone;
  if (!lookupPhone && username) {
    const alias = usernameAliases[username.toLowerCase()];
    if (alias) {
      lookupPhone = alias.phone;
    } else {
      lookupPhone = username;
    }
  }

  if (!lookupPhone || !password) {
    return res.status(400).json({ error: '账号和密码不能为空' });
  }

  const db = getDB();
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(lookupPhone);

  if (!user) {
    return res.status(401).json({ error: '账号不存在，请检查输入' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '密码错误，请重新输入' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用，请联系管理员' });
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const roleLabels = {
    admin: '平台运营',
    requester: '需求方',
    courier: '跑腿员',
  };

  const rolePermissions = {
    admin: ['dashboard', 'order_manage', 'courier_manage', 'dispatch', 'quality_rules', 'credit_manage', 'enterprise_api', 'service_areas'],
    requester: ['publish_order', 'my_orders', 'review'],
    courier: ['accept_order', 'checkin', 'tracking', 'complete_order'],
  };

  res.json({
    token,
    user: {
      id: user.id, phone: user.phone, name: user.name,
      role: user.role, roleLabel: roleLabels[user.role],
      permissions: rolePermissions[user.role] || [],
      credit_score: user.credit_score, status: user.status
    }
  });
});

router.get('/me', verifyToken, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, phone, name, role, credit_score, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'courier') {
    const courierProfile = db.prepare('SELECT * FROM courier_profiles WHERE user_id = ?').get(user.id);
    res.json({ user, courierProfile });
    return;
  }

  res.json({ user });
});

module.exports = router;
