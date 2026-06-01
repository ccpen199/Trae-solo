const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { roleMiddleware, createAuditLog } = require('../middleware/auth');

const router = express.Router();

router.get('/', roleMiddleware('admin'), (req, res) => {
  const users = db.prepare(`
    SELECT id, username, name, email, role, status, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all();
  res.json(users);
});

router.get('/:id', roleMiddleware('admin'), (req, res) => {
  const user = db.prepare(`
    SELECT id, username, name, email, role, status, created_at, updated_at
    FROM users
    WHERE id = ?
  `).get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const permissions = db.prepare(`
    SELECT p.*, a.name as app_name
    FROM permissions p
    LEFT JOIN applications a ON p.app_id = a.id
    WHERE p.user_id = ?
  `).all(req.params.id);

  res.json({ ...user, permissions });
});

router.post('/', roleMiddleware('admin'), (req, res) => {
  const { username, password, name, email, role } = req.body;
  const currentUser = req.user;

  const validation = [];
  if (!username || username.length < 3) validation.push('用户名至少3个字符');
  if (!password || password.length < 6) validation.push('密码至少6个字符');
  if (!name) validation.push('姓名不能为空');
  if (!['admin', 'developer', 'operator', 'owner', 'security'].includes(role)) validation.push('无效的角色');

  if (validation.length > 0) {
    return res.status(400).json({ error: '字段验证失败', details: validation });
  }

  const existing = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(username);
  if (existing.count > 0) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO users (id, username, password, name, email, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, username, bcrypt.hashSync(password, 10), name, email || '', role);

  createAuditLog(currentUser.id, currentUser.name, 'create_user', 'user', id, { username, role }, req.ip);

  const user = db.prepare('SELECT id, username, name, email, role, status FROM users WHERE id = ?').get(id);
  res.status(201).json(user);
});

router.post('/:id/permissions', roleMiddleware('admin'), (req, res) => {
  const { app_id, resource_type, action } = req.body;
  const userId = req.params.id;
  const currentUser = req.user;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO permissions (id, user_id, app_id, resource_type, action, granted_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, app_id || null, resource_type, action, currentUser.id);
  } catch (e) {
    return res.status(400).json({ error: '权限已存在' });
  }

  createAuditLog(currentUser.id, currentUser.name, 'grant_permission', 'permission', id, { userId, resource_type, action }, req.ip);

  res.status(201).json({ id, user_id: userId, resource_type, action });
});

module.exports = router;
