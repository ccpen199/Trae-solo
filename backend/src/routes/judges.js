const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  const judges = db.prepare('SELECT * FROM judges WHERE is_active = 1 ORDER BY name').all();
  res.json(judges);
});

router.get('/leaves', (req, res) => {
  const leaves = db.prepare(`
    SELECT jl.*, j.name as judge_name 
    FROM judge_leaves jl 
    JOIN judges j ON jl.judge_id = j.id 
    ORDER BY jl.start_date DESC
  `).all();
  res.json(leaves);
});

router.post('/leaves', (req, res) => {
  const { judge_id, start_date, end_date, reason } = req.body;
  const result = db.prepare(
    'INSERT INTO judge_leaves (judge_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)'
  ).run(judge_id, start_date, end_date, reason);
  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

module.exports = router;
