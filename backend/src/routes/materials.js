const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/scheme/:schemeId', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM material_checklists WHERE scheme_id = ?').all(req.params.schemeId);
  res.json(rows);
});

router.post('/', authenticateToken, (req, res) => {
  const { scheme_id, item_name, required } = req.body;
  
  const result = db.prepare('INSERT INTO material_checklists (scheme_id, item_name, required) VALUES (?, ?, ?)')
    .run(scheme_id, item_name, required);
  
  res.json({ id: result.lastInsertRowid, message: '添加成功' });
});

router.put('/:id', authenticateToken, (req, res) => {
  const { item_name, required, status, notes } = req.body;
  
  db.prepare(`
    UPDATE material_checklists 
    SET item_name = ?, required = ?, status = ?, notes = ?, submitted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(item_name, required, status, notes, req.params.id);
  
  res.json({ message: '更新成功' });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM material_checklists WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
