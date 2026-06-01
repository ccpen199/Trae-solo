const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/overview', (req, res) => {
  const { semester } = req.query;
  const semesterValue = semester || '2024-2025-1';
  
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const recordCount = db.prepare('SELECT COUNT(*) as count FROM evaluation_records WHERE semester = ?').get(semesterValue).count;
  const pendingAppealCount = db.prepare('SELECT COUNT(*) as count FROM appeals WHERE status = ?').get('pending').count;
  const archiveCount = db.prepare('SELECT COUNT(*) as count FROM archives WHERE is_archived = 1 AND semester = ?').get(semesterValue).count;
  
  res.json({
    student_count: studentCount,
    record_count: recordCount,
    pending_appeal_count: pendingAppealCount,
    archive_count: archiveCount
  });
});

router.get('/class-ranking', (req, res) => {
  const { grade, class_name, semester } = req.query;
  const semesterValue = semester || '2024-2025-1';
  
  let sql = `
    SELECT 
      s.id,
      s.name,
      s.student_no,
      s.grade,
      s.class_name,
      COALESCE(SUM(CASE WHEN r.type = 'bonus' THEN r.score ELSE 0 END), 0) as total_bonus,
      COALESCE(SUM(CASE WHEN r.type = 'penalty' THEN ABS(r.score) ELSE 0 END), 0) as total_penalty,
      COALESCE(SUM(CASE WHEN r.type = 'bonus' THEN r.score WHEN r.type = 'penalty' THEN -r.score ELSE 0 END), 0) as overall_score,
      COUNT(r.id) as record_count
    FROM students s
    LEFT JOIN evaluation_records r ON s.id = r.student_id AND r.semester = ?
    WHERE 1=1
  `;
  const params = [semesterValue];
  
  if (grade) {
    sql += ' AND s.grade = ?';
    params.push(grade);
  }
  if (class_name) {
    sql += ' AND s.class_name = ?';
    params.push(class_name);
  }
  
  sql += ' GROUP BY s.id ORDER BY overall_score DESC';
  
  const rankings = db.prepare(sql).all(...params);
  res.json(rankings);
});

router.get('/dimension-stats', (req, res) => {
  const { semester } = req.query;
  const semesterValue = semester || '2024-2025-1';
  
  const sql = `
    SELECT 
      d.id,
      d.name,
      d.code,
      COUNT(r.id) as record_count,
      SUM(CASE WHEN r.type = 'bonus' THEN 1 ELSE 0 END) as bonus_count,
      SUM(CASE WHEN r.type = 'penalty' THEN 1 ELSE 0 END) as penalty_count,
      AVG(CASE WHEN r.type = 'bonus' THEN r.score ELSE NULL END) as avg_bonus_score,
      AVG(CASE WHEN r.type = 'penalty' THEN ABS(r.score) ELSE NULL END) as avg_penalty_score
    FROM evaluation_dimensions d
    LEFT JOIN evaluation_records r ON d.id = r.dimension_id AND r.semester = ?
    WHERE d.is_active = 1
    GROUP BY d.id
    ORDER BY d.id
  `;
  
  const stats = db.prepare(sql).all(semesterValue);
  res.json(stats);
});

router.get('/class-stats', (req, res) => {
  const { semester } = req.query;
  const semesterValue = semester || '2024-2025-1';
  
  const sql = `
    SELECT 
      s.grade,
      s.class_name,
      COUNT(DISTINCT s.id) as student_count,
      COUNT(r.id) as record_count,
      AVG(CASE WHEN r.type = 'bonus' THEN r.score WHEN r.type = 'penalty' THEN -r.score ELSE 0 END) as avg_score
    FROM students s
    LEFT JOIN evaluation_records r ON s.id = r.student_id AND r.semester = ?
    GROUP BY s.grade, s.class_name
    ORDER BY s.grade, s.class_name
  `;
  
  const stats = db.prepare(sql).all(semesterValue);
  res.json(stats);
});

module.exports = router;
