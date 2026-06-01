import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      real_name: req.user.real_name,
      role: req.user.role
    },
    permissions: db.prepare(`
      SELECT resource, action, allowed 
      FROM permission_matrix 
      WHERE role = ?
    `).all(req.user.role)
  });
});

router.get('/', checkPermission('user', 'manage'), (req, res) => {
  const { role, status, keyword, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT id, username, real_name, email, phone, role, status, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (keyword) {
    query += ' AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params).count;
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const users = db.prepare(query).all(...params);

  res.json({
    list: users,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/list', (req, res) => {
  const users = db.prepare('SELECT id, username, real_name, role FROM users WHERE status = ?').all('active');
  res.json(users);
});

export default router;
