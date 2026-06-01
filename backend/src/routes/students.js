const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const { grade, class_name } = req.query;
  let sql = 'SELECT * FROM students WHERE 1=1';
  const params = [];
  
  if (grade) {
    sql += ' AND grade = ?';
    params.push(grade);
  }
  if (class_name) {
    sql += ' AND class_name = ?';
    params.push(class_name);
  }
  
  const students = db.prepare(sql).all(...params);
  res.json(students);
});

router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  res.json(student);
});

router.post('/', (req, res) => {
  const { student_no, name, grade, class_name, gender, parent_name, parent_phone } = req.body;
  
  const stmt = db.prepare('INSERT INTO students (student_no, name, grade, class_name, gender, parent_name, parent_phone) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(student_no, name, grade, class_name, gender, parent_name, parent_phone);
  res.json({ id: result.lastInsertRowid, student_no, name, grade, class_name });
});

router.put('/:id', (req, res) => {
  const { student_no, name, grade, class_name, gender, parent_name, parent_phone } = req.body;
  
  const stmt = db.prepare('UPDATE students SET student_no = ?, name = ?, grade = ?, class_name = ?, gender = ?, parent_name = ?, parent_phone = ? WHERE id = ?');
  const result = stmt.run(student_no, name, grade, class_name, gender, parent_name, parent_phone, req.params.id);
  res.json({ success: true, changes: result.changes });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true, changes: result.changes });
});

router.get('/:id/evaluation-summary', (req, res) => {
  const dimensionSql = `
    SELECT 
      d.id as dimension_id,
      d.name as dimension_name,
      d.code as dimension_code,
      COALESCE(SUM(CASE WHEN r.type = 'bonus' THEN r.score ELSE 0 END), 0) as bonus_score,
      COALESCE(SUM(CASE WHEN r.type = 'penalty' THEN ABS(r.score) ELSE 0 END), 0) as penalty_score,
      COUNT(r.id) as record_count
    FROM evaluation_dimensions d
    LEFT JOIN evaluation_records r ON d.id = r.dimension_id AND r.student_id = ?
    WHERE d.is_active = 1
    GROUP BY d.id
  `;
  
  const dimensionScores = db.prepare(dimensionSql).all(req.params.id);
  
  const totalScore = dimensionScores.reduce((sum, d) => {
    return sum + (d.bonus_score || 0) - (d.penalty_score || 0);
  }, 0);
  
  res.json({
    student_id: req.params.id,
    total_score: totalScore,
    dimensions: dimensionScores
  });
});

module.exports = router;
