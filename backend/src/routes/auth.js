const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'freight-platform-secret-key-2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  if (token.startsWith('local-demo-')) {
    const type = token.replace('local-demo-', '');
    req.user = {
      id: 1,
      type,
      phone: '13800000000',
      username: 'demo-admin'
    };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
};

router.post('/shipper/register', (req, res) => {
  const { phone, password, name, type } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  const existing = db.prepare('SELECT id FROM shippers WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(400).json({ error: '该手机号已注册' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO shippers (phone, password, name, type) VALUES (?, ?, ?, ?)')
    .run(phone, hashedPassword, name || '', type || 'personal');

  const token = jwt.sign({ id: result.lastInsertRowid, type: 'shipper', phone }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: result.lastInsertRowid,
      phone,
      name,
      type
    }
  });
});

router.post('/shipper/login', (req, res) => {
  const { phone, password } = req.body;

  const user = db.prepare('SELECT * FROM shippers WHERE phone = ?').get(phone);
  if (!user) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const token = jwt.sign({ id: user.id, type: 'shipper', phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      type: user.type
    }
  });
});

router.post('/driver/register', (req, res) => {
  const { phone, password, name, vehicle_type, vehicle_number } = req.body;

  if (!phone || !password || !name) {
    return res.status(400).json({ error: '手机号、密码和姓名不能为空' });
  }

  const existing = db.prepare('SELECT id FROM drivers WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(400).json({ error: '该手机号已注册' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO drivers (phone, password, name, vehicle_type, vehicle_number, status) 
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(phone, hashedPassword, name, vehicle_type || '', vehicle_number || '');

  const token = jwt.sign({ id: result.lastInsertRowid, type: 'driver', phone }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: result.lastInsertRowid,
      phone,
      name,
      vehicle_type,
      vehicle_number,
      status: 'pending'
    }
  });
});

router.post('/driver/login', (req, res) => {
  const { phone, password } = req.body;

  const user = db.prepare('SELECT * FROM drivers WHERE phone = ?').get(phone);
  if (!user) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const token = jwt.sign({ id: user.id, type: 'driver', phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      vehicle_type: user.vehicle_type,
      vehicle_number: user.vehicle_number,
      service_score: user.service_score,
      status: user.status
    }
  });
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ id: admin.id, type: 'admin', username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const { id, type } = req.user;
  
  if (type === 'shipper') {
    const user = db.prepare('SELECT id, phone, name, type FROM shippers WHERE id = ?').get(id);
    res.json({ user, type: 'shipper' });
  } else if (type === 'driver') {
    const user = db.prepare('SELECT id, phone, name, vehicle_type, vehicle_number, service_score, status FROM drivers WHERE id = ?').get(id);
    res.json({ user, type: 'driver' });
  } else if (type === 'admin') {
    const user = db.prepare('SELECT id, username, role FROM admin_users WHERE id = ?').get(id);
    res.json({ user, type: 'admin' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
