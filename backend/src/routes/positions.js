const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const positions = db.prepare('SELECT * FROM positions').all();
  res.json({ success: true, data: positions });
});

router.get('/:id', (req, res) => {
  const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(req.params.id);
  if (!position) {
    return res.status(404).json({ success: false, message: '岗位不存在' });
  }
  const requirements = db.prepare('SELECT * FROM position_requirements WHERE position_id = ?').all(req.params.id);
  res.json({ success: true, data: { ...position, requirements } });
});

router.post('/', (req, res) => {
  const { position_code, position_name, department, description } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO positions (position_code, position_name, department, description)
      VALUES (?, ?, ?, ?)
    `).run(position_code, position_name, department, description);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/requirements', (req, res) => {
  const { requirement_type, requirement_content, retraining_cycle } = req.body;
  const result = db.prepare(`
    INSERT INTO position_requirements (position_id, requirement_type, requirement_content, retraining_cycle)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, requirement_type, requirement_content, retraining_cycle);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM positions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
