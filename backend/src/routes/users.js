const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { permissionMiddleware } = require('../middleware/auth');

router.get('/me', (req, res) => {
  res.json(req.user);
});

router.get('/', permissionMiddleware(['admin']), (req, res) => {
  const users = db.prepare(`
    SELECT u.*, 
      (SELECT COUNT(*) FROM permissions p WHERE p.user_id = u.id) as permission_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all();
  
  res.json(users);
});

router.get('/:id/permissions', permissionMiddleware(['admin']), (req, res) => {
  const permissions = db.prepare(`
    SELECT p.*, a.name as app_name
    FROM permissions p
    LEFT JOIN applications a ON p.app_id = a.id
    WHERE p.user_id = ?
  `).all(req.params.id);
  
  res.json(permissions);
});

router.post('/:id/permissions', permissionMiddleware(['admin']), (req, res) => {
  const { app_id, role } = req.body;
  const userId = req.params.id;

  if (!role) {
    return res.status(400).json({ error: '角色必填' });
  }

  const id = `perm-${Date.now()}`;
  db.prepare(`
    INSERT INTO permissions (id, user_id, app_id, role)
    VALUES (?, ?, ?, ?)
  `).run(id, userId, app_id || null, role);

  const perm = db.prepare('SELECT * FROM permissions WHERE id = ?').get(id);
  res.status(201).json(perm);
});

module.exports = router;
