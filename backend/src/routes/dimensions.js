const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const dimensions = db.prepare('SELECT * FROM evaluation_dimensions WHERE is_active = 1 ORDER BY id').all();
  res.json(dimensions);
});

router.get('/:id', (req, res) => {
  const dimension = db.prepare('SELECT * FROM evaluation_dimensions WHERE id = ?').get(req.params.id);
  res.json(dimension);
});

router.post('/', (req, res) => {
  const { name, code, description, weight, applicable_grades } = req.body;
  const created_by = req.body.created_by || 1;
  
  const stmt = db.prepare('INSERT INTO evaluation_dimensions (name, code, description, weight, applicable_grades, version, is_active, created_by) VALUES (?, ?, ?, ?, ?, 1, 1, ?)');
  const result = stmt.run(name, code, description, weight, applicable_grades, created_by);
  res.json({ id: result.lastInsertRowid, name, code, description, weight, applicable_grades });
});

router.put('/:id', (req, res) => {
  const { name, code, description, weight, applicable_grades } = req.body;
  
  const stmt = db.prepare('UPDATE evaluation_dimensions SET name = ?, code = ?, description = ?, weight = ?, applicable_grades = ?, version = version + 1 WHERE id = ?');
  const result = stmt.run(name, code, description, weight, applicable_grades, req.params.id);
  res.json({ success: true, changes: result.changes });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('UPDATE evaluation_dimensions SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, changes: result.changes });
});

router.get('/:id/indicators', (req, res) => {
  const indicators = db.prepare('SELECT * FROM evaluation_indicators WHERE dimension_id = ? AND is_active = 1 ORDER BY id').all(req.params.id);
  res.json(indicators);
});

router.post('/:id/indicators', (req, res) => {
  const { name, code, description, max_score, weight } = req.body;
  const created_by = req.body.created_by || 1;
  const dimension_id = req.params.id;
  
  const stmt = db.prepare('INSERT INTO evaluation_indicators (dimension_id, name, code, description, max_score, weight, version, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)');
  const result = stmt.run(dimension_id, name, code, description, max_score, weight, created_by);
  res.json({ id: result.lastInsertRowid, dimension_id, name, code });
});

router.put('/indicators/:id', (req, res) => {
  const { name, code, description, max_score, weight } = req.body;
  
  const stmt = db.prepare('UPDATE evaluation_indicators SET name = ?, code = ?, description = ?, max_score = ?, weight = ?, version = version + 1 WHERE id = ?');
  const result = stmt.run(name, code, description, max_score, weight, req.params.id);
  res.json({ success: true, changes: result.changes });
});

router.delete('/indicators/:id', (req, res) => {
  const result = db.prepare('UPDATE evaluation_indicators SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, changes: result.changes });
});

module.exports = router;
