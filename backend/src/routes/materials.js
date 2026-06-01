const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', (req, res) => {
  const { category, status } = req.query;
  let sql = 'SELECT * FROM materials WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  
  const materials = db.prepare(sql).all(...params);
  res.json(materials);
});

router.get('/:id', (req, res) => {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) {
    return res.status(404).json({ error: '原料不存在' });
  }
  res.json(material);
});

router.post('/', (req, res) => {
  const { name, code, category, unit, spec, description } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO materials (name, code, category, unit, spec, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, code, category, unit, spec, description);
    
    res.json({ id: result.lastInsertRowid, name, code });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, code, category, unit, spec, description, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE materials 
      SET name = ?, code = ?, category = ?, unit = ?, spec = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, code, category, unit, spec, description, status, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const materialId = req.params.id;
  db.prepare('UPDATE materials SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('inactive', materialId);
  db.prepare('UPDATE material_prices SET is_active = 0 WHERE material_id = ?').run(materialId);
  res.json({ success: true });
});

module.exports = router;
