const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const parseUser = (u) => {
  if (!u) return u;
  delete u.password;
  return u;
};

router.get('/', authenticateToken, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 10, keyword, role } = req.query;
  const offset = (page - 1) * pageSize;
  let sql = 'SELECT u.*, c.company_name FROM users u LEFT JOIN companies c ON u.id = c.user_id WHERE 1=1';
  const params = [];
  if (keyword) { sql += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (role) { sql += ' AND u.role = ?'; params.push(role); }
  sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), parseInt(offset));
  const users = db.prepare(sql).all(...params).map(parseUser);
  const total = db.prepare('SELECT COUNT(*) as c FROM users WHERE 1=1').get().c;
  res.json({ list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT u.*, c.company_name, c.industry, c.scale, c.description, c.verified FROM users u LEFT JOIN companies c ON u.id = c.user_id WHERE u.id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    delete user.phone;
    delete user.email;
  }
  res.json(parseUser(user));
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  const { username, password, real_name, phone, email, role } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: '用户名已存在' });
  const bcrypt = require('bcryptjs');
  const hashed = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username, password, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)').run(username, hashed, real_name, phone, email, role || 'user');
  db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip, details) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, 'create_user', 'user', info.lastInsertRowid, req.ip, JSON.stringify({ username, real_name }));
  res.json({ id: info.lastInsertRowid, success: true });
});

router.put('/:id', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') return res.status(403).json({ error: '无权限修改' });
  const { real_name, phone, email, avatar } = req.body;
  db.prepare('UPDATE users SET real_name=?, phone=?, email=?, avatar=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(real_name || user.real_name, phone || user.phone, email || user.email, avatar || user.avatar, req.params.id);
  if (req.body.role && req.user.role === 'admin') {
    db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, req.params.id);
  }
  db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip, details) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, 'update_user', 'user', req.params.id, req.ip, JSON.stringify({ target_user: req.params.id }));
  res.json({ success: true });
});

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.role === 'admin') return res.status(400).json({ error: '不能删除管理员账户' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip, details) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, 'delete_user', 'user', req.params.id, req.ip, JSON.stringify({ username: user.username, real_name: user.real_name }));
  res.json({ success: true });
});

router.put('/:id/company', authenticateToken, requireRole('company'), (req, res) => {
  if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: '无权限修改' });
  const { company_name, industry, scale, description, license_url } = req.body;
  const existing = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.params.id);
  if (existing) {
    db.prepare('UPDATE companies SET company_name=?, industry=?, scale=?, description=?, license_url=?, verified=0, updated_at=CURRENT_TIMESTAMP WHERE user_id=?').run(company_name, industry, scale, description, license_url, req.params.id);
  } else {
    db.prepare('INSERT INTO companies (user_id, company_name, industry, scale, description, license_url) VALUES (?, ?, ?, ?, ?, ?)').run(req.params.id, company_name, industry, scale, description, license_url);
  }
  db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, ip, details) VALUES (?, ?, ?, ?, ?)').run(req.user.id, 'update_company', 'company', req.ip, JSON.stringify({ company_name }));
  res.json({ success: true });
});

module.exports = router;
