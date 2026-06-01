const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { type, value, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (type) {
    whereClause += ' AND type = ?';
    params.push(type);
  }
  
  if (value) {
    whereClause += ' AND (value LIKE ? OR alias LIKE ?)';
    params.push(`%${value}%`, `%${value}%`);
  }
  
  const items = db.prepare(`
    SELECT * FROM blacklist 
    ${whereClause}
    ORDER BY added_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM blacklist ${whereClause}`).get(...params);
  
  res.json({
    data: items,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/', (req, res) => {
  const { type, value, alias, source, risk_level, added_by } = req.body;
  
  const result = db.prepare(`
    INSERT INTO blacklist (type, value, alias, source, risk_level, added_by, confirmed)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(type, value, alias || null, source || 'manual', risk_level || 'medium', added_by || 'system');
  
  const item = db.prepare('SELECT * FROM blacklist WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/:id/confirm', (req, res) => {
  const { id } = req.params;
  const { confirmed, confirmed_by } = req.body;
  
  db.prepare('UPDATE blacklist SET confirmed = ?, added_by = ? WHERE id = ?')
    .run(confirmed ? 1 : 0, confirmed_by || 'system', id);
  
  const item = db.prepare('SELECT * FROM blacklist WHERE id = ?').get(id);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM blacklist WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
