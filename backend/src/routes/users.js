const express = require('express');
const router = express.Router();
const db = require('../models/database');
const bcrypt = require('bcryptjs');
const { checkPermission } = require('../middleware/auth');

router.get('/me', (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    real_name: req.user.real_name,
    email: req.user.email,
    role_name: req.user.role_name,
    permissions: req.user.permissions
  });
});

router.get('/', checkPermission('user:read'), (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.email, u.phone, u.status, 
           r.name as role_name, r.description as role_description,
           u.created_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `).all();
  
  res.json({ data: users });
});

router.get('/roles', (req, res) => {
  const roles = db.prepare('SELECT * FROM roles ORDER BY id').all();
  roles.forEach(r => {
    r.permissions = JSON.parse(r.permissions);
  });
  res.json({ data: roles });
});

module.exports = router;
