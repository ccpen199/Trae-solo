const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { role } = req.query;
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    sql += ' ORDER BY created_at DESC';
    
    const users = db.prepare(sql).all(...params);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
