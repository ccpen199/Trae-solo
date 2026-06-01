const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const { status, student_id } = req.query;
  let sql = `
    SELECT a.*, s.name as student_name, r.reason as record_reason, r.score, r.type as record_type,
           u1.name as appellant_name, u2.name as handler_name
    FROM appeals a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN evaluation_records r ON a.record_id = r.id
    LEFT JOIN users u1 ON a.appellant_id = u1.id
    LEFT JOIN users u2 ON a.handled_by = u2.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (student_id) {
    sql += ' AND a.student_id = ?';
    params.push(student_id);
  }
  
  sql += ' ORDER BY a.created_at DESC';
  
  const appeals = db.prepare(sql).all(...params);
  res.json(appeals);
});

router.get('/:id', (req, res) => {
  const appeal = db.prepare(`
    SELECT a.*, s.name as student_name, r.reason as record_reason, r.score,
           u1.name as appellant_name, u2.name as handler_name
    FROM appeals a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN evaluation_records r ON a.record_id = r.id
    LEFT JOIN users u1 ON a.appellant_id = u1.id
    LEFT JOIN users u2 ON a.handled_by = u2.id
    WHERE a.id = ?
  `).get(req.params.id);
  res.json(appeal);
});

router.post('/', (req, res) => {
  const { record_id, student_id, reason, supplementary_materials } = req.body;
  const appellant_id = req.body.appellant_id || 5;
  
  const stmt = db.prepare('INSERT INTO appeals (record_id, student_id, appellant_id, reason, supplementary_materials, status) VALUES (?, ?, ?, ?, ?, ?)');
  const result = stmt.run(record_id, student_id, appellant_id, reason, supplementary_materials, 'pending');
  res.json({ id: result.lastInsertRowid, record_id, student_id, reason, status: 'pending' });
});

router.put('/:id/handle', (req, res) => {
  const { status, conclusion } = req.body;
  const handled_by = req.body.handled_by || 1;
  const handled_at = new Date().toISOString();
  
  const stmt = db.prepare('UPDATE appeals SET status = ?, conclusion = ?, handled_by = ?, handled_at = ? WHERE id = ?');
  const result = stmt.run(status, conclusion, handled_by, handled_at, req.params.id);
  res.json({ success: true, changes: result.changes });
});

module.exports = router;
