const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const fleets = db.prepare('SELECT * FROM fleets ORDER BY name').all();
  
  const fleetsWithCount = fleets.map(fleet => {
    const count = db.prepare('SELECT COUNT(*) as count FROM crew_members WHERE fleet_id = ?').get(fleet.id);
    return { ...fleet, crew_count: count.count };
  });
  
  res.json(fleetsWithCount);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, description } = req.body;
  
  try {
    const result = db.prepare('INSERT INTO fleets (name, description) VALUES (?, ?)').run(name, description);
    res.json({ id: result.lastInsertRowid, name, description });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, description } = req.body;
  
  const result = db.prepare('UPDATE fleets SET name=?, description=? WHERE id=?').run(name, description, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '车队不存在' });
  }
  
  res.json({ id: req.params.id, name, description });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM fleets WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '车队不存在' });
  }
  
  res.json({ success: true });
});

module.exports = router;
