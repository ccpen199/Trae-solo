const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const { student_id, semester, is_archived } = req.query;
  let sql = `
    SELECT a.*, s.name as student_name, s.student_no, s.grade, s.class_name,
           u.name as archiver_name
    FROM archives a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN users u ON a.archived_by = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (student_id) {
    sql += ' AND a.student_id = ?';
    params.push(student_id);
  }
  if (semester) {
    sql += ' AND a.semester = ?';
    params.push(semester);
  }
  if (is_archived !== undefined) {
    sql += ' AND a.is_archived = ?';
    params.push(is_archived ? 1 : 0);
  }
  
  sql += ' ORDER BY a.created_at DESC';
  
  const archives = db.prepare(sql).all(...params);
  res.json(archives);
});

router.get('/:id', (req, res) => {
  const archive = db.prepare(`
    SELECT a.*, s.name as student_name, s.student_no, s.grade, s.class_name,
           u.name as archiver_name
    FROM archives a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN users u ON a.archived_by = u.id
    WHERE a.id = ?
  `).get(req.params.id);
  res.json(archive);
});

router.post('/', (req, res) => {
  const { student_id, semester } = req.body;
  const archived_by = req.body.archived_by || 1;
  
  const dimensionSql = `
    SELECT 
      d.id as dimension_id,
      d.name as dimension_name,
      COALESCE(SUM(CASE WHEN r.type = 'bonus' THEN r.score ELSE 0 END), 0) as bonus,
      COALESCE(SUM(CASE WHEN r.type = 'penalty' THEN ABS(r.score) ELSE 0 END), 0) as penalty
    FROM evaluation_dimensions d
    LEFT JOIN evaluation_records r ON d.id = r.dimension_id AND r.student_id = ? AND r.semester = ?
    WHERE d.is_active = 1
    GROUP BY d.id
  `;
  
  const dimensionScores = db.prepare(dimensionSql).all(student_id, semester);
  
  const totalScore = dimensionScores.reduce((sum, d) => {
    return sum + (d.bonus || 0) - (d.penalty || 0);
  }, 0);
  
  const dimension_scores = JSON.stringify(dimensionScores);
  
  const records = db.prepare('SELECT id FROM evaluation_records WHERE student_id = ? AND semester = ?').all(student_id, semester);
  const record_ids = JSON.stringify(records.map(r => r.id));
  
  const stmt = db.prepare('INSERT INTO archives (student_id, semester, overall_score, dimension_scores, record_ids, is_archived, archived_by, archived_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)');
  const result = stmt.run(student_id, semester, totalScore, dimension_scores, record_ids, archived_by, new Date().toISOString());
  
  res.json({ id: result.lastInsertRowid, student_id, semester, overall_score: totalScore, is_archived: 1 });
});

router.get('/:id/modifications', (req, res) => {
  const modifications = db.prepare(`
    SELECT m.*, u1.name as modifier_name, u2.name as approver_name
    FROM archive_modifications m
    LEFT JOIN users u1 ON m.modified_by = u1.id
    LEFT JOIN users u2 ON m.approved_by = u2.id
    WHERE m.archive_id = ?
    ORDER BY m.created_at DESC
  `).all(req.params.id);
  res.json(modifications);
});

router.post('/:id/modifications', (req, res) => {
  const { change_reason, change_content } = req.body;
  const modified_by = req.body.modified_by || 1;
  
  const stmt = db.prepare('INSERT INTO archive_modifications (archive_id, modified_by, change_reason, change_content, approval_status) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(req.params.id, modified_by, change_reason, change_content, 'pending');
  res.json({ id: result.lastInsertRowid, archive_id: req.params.id, change_reason, status: 'pending' });
});

router.put('/modifications/:id/approve', (req, res) => {
  const { status } = req.body;
  const approved_by = req.body.approved_by || 1;
  
  const stmt = db.prepare('UPDATE archive_modifications SET approval_status = ?, approved_by = ?, approved_at = ? WHERE id = ?');
  const result = stmt.run(status, approved_by, new Date().toISOString(), req.params.id);
  res.json({ success: true, changes: result.changes });
});

module.exports = router;
