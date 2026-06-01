const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const users = db.prepare(`
    SELECT id, username, name, role, department, email, created_at 
    FROM users 
    ORDER BY name
  `).all();
  res.json(users);
});

router.get('/:id', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT id, username, name, role, department, email, created_at 
    FROM users 
    WHERE id = ?
  `).get(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  res.json(user);
});

module.exports = router;
