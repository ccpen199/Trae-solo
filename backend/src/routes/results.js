const express = require('express');
const { db } = require('../database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { risk_level, plan_id, grade, class: cls } = req.query;
  let query = `
    SELECT r.*, rec.plan_id, rec.student_id, p.name as plan_name, s.name as scale_name,
           u.name as student_name, u.grade, u.class
    FROM assessment_results r
    JOIN assessment_records rec ON r.record_id = rec.id
    JOIN assessment_plans p ON rec.plan_id = p.id
    JOIN scales s ON p.scale_id = s.id
    JOIN users u ON rec.student_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'student') {
    query += ' AND rec.student_id = ?';
    params.push(req.user.id);
  } else {
    if (risk_level) {
      query += ' AND r.risk_level = ?';
      params.push(risk_level);
    }

    if (plan_id) {
      query += ' AND rec.plan_id = ?';
      params.push(plan_id);
    }

    if (grade) {
      query += ' AND u.grade = ?';
      params.push(grade);
    }

    if (cls) {
      query += ' AND u.class = ?';
      params.push(cls);
    }

    if (req.user.role === 'teacher') {
      query += ' AND u.grade = ? AND u.class = ?';
      params.push(req.user.grade, req.user.class);
    }
  }

  query += ' ORDER BY r.created_at DESC';

  const results = db.prepare(query).all(...params);

  results.forEach(r => {
    r.dimension_scores = JSON.parse(r.dimension_scores);
    if (r.risk_factors) r.risk_factors = JSON.parse(r.risk_factors);
  });

  res.json(results);
});

router.get('/:id', (req, res) => {
  const result = db.prepare(`
    SELECT r.*, rec.plan_id, rec.student_id, rec.answers, p.name as plan_name, 
           s.name as scale_name, s.questions, s.dimensions, u.name as student_name, 
           u.grade, u.class, p.is_anonymous
    FROM assessment_results r
    JOIN assessment_records rec ON r.record_id = rec.id
    JOIN assessment_plans p ON rec.plan_id = p.id
    JOIN scales s ON p.scale_id = s.id
    JOIN users u ON rec.student_id = u.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!result) {
    return res.status(404).json({ error: '结果不存在' });
  }

  if (req.user.role === 'student' && result.student_id !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  if (req.user.role === 'teacher') {
    if (result.grade !== req.user.grade || result.class !== req.user.class) {
      return res.status(403).json({ error: '权限不足' });
    }
  }

  result.dimension_scores = JSON.parse(result.dimension_scores);
  if (result.risk_factors) result.risk_factors = JSON.parse(result.risk_factors);
  if (result.answers) result.answers = JSON.parse(result.answers);
  if (result.questions) result.questions = JSON.parse(result.questions);
  if (result.dimensions) result.dimensions = JSON.parse(result.dimensions);

  if (result.is_anonymous && req.user.role !== 'psychologist' && req.user.role !== 'admin') {
    delete result.student_id;
    delete result.student_name;
  }

  res.json(result);
});

router.get('/student/:student_id/history', requireRole('admin', 'psychologist', 'teacher'), (req, res) => {
  if (req.user.role === 'teacher') {
    const student = db.prepare('SELECT grade, class FROM users WHERE id = ?').get(req.params.student_id);
    if (!student || student.grade !== req.user.grade || student.class !== req.user.class) {
      return res.status(403).json({ error: '权限不足' });
    }
  }

  const results = db.prepare(`
    SELECT r.*, rec.plan_id, p.name as plan_name, s.name as scale_name
    FROM assessment_results r
    JOIN assessment_records rec ON r.record_id = rec.id
    JOIN assessment_plans p ON rec.plan_id = p.id
    JOIN scales s ON p.scale_id = s.id
    WHERE rec.student_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.student_id);

  results.forEach(r => {
    r.dimension_scores = JSON.parse(r.dimension_scores);
  });

  res.json(results);
});

router.get('/statistics/risk-distribution', requireRole('admin', 'psychologist'), (req, res) => {
  const { plan_id } = req.query;
  let query = `
    SELECT risk_level, COUNT(*) as count
    FROM assessment_results
    WHERE 1=1
  `;
  const params = [];

  if (plan_id) {
    query += ' AND record_id IN (SELECT id FROM assessment_records WHERE plan_id = ?)';
    params.push(plan_id);
  }

  query += ' GROUP BY risk_level';

  const distribution = db.prepare(query).all(...params);

  const result = {
    normal: 0,
    mild: 0,
    moderate: 0,
    severe: 0
  };

  distribution.forEach(d => {
    result[d.risk_level] = d.count;
  });

  res.json(result);
});

router.get('/statistics/grade-comparison', requireRole('admin', 'psychologist'), (req, res) => {
  const results = db.prepare(`
    SELECT 
      u.grade,
      AVG(r.total_score) as avg_score,
      COUNT(*) as total_count,
      SUM(CASE WHEN r.risk_level = 'severe' THEN 1 ELSE 0 END) as severe_count,
      SUM(CASE WHEN r.risk_level = 'moderate' THEN 1 ELSE 0 END) as moderate_count,
      SUM(CASE WHEN r.risk_level = 'mild' THEN 1 ELSE 0 END) as mild_count,
      SUM(CASE WHEN r.risk_level = 'normal' THEN 1 ELSE 0 END) as normal_count
    FROM assessment_results r
    JOIN assessment_records rec ON r.record_id = rec.id
    JOIN users u ON rec.student_id = u.id
    GROUP BY u.grade
    ORDER BY u.grade
  `).all();

  res.json(results);
});

router.get('/at-risk-students', requireRole('admin', 'psychologist', 'teacher'), (req, res) => {
  const { min_risk = 'mild' } = req.query;
  const riskLevels = ['mild', 'moderate', 'severe'];
  const minIndex = riskLevels.indexOf(min_risk);
  const filterLevels = riskLevels.slice(minIndex);

  let query = `
    SELECT DISTINCT
      u.id as student_id,
      u.name as student_name,
      u.grade,
      u.class,
      r.risk_level,
      r.total_score,
      r.created_at as assessment_date,
      p.name as plan_name,
      (SELECT COUNT(*) FROM interventions i WHERE i.student_id = u.id AND i.is_closed = 0) as open_interventions
    FROM assessment_results r
    JOIN assessment_records rec ON r.record_id = rec.id
    JOIN users u ON rec.student_id = u.id
    JOIN assessment_plans p ON rec.plan_id = p.id
    WHERE r.risk_level IN (${filterLevels.map(() => '?').join(',')})
  `;
  const params = [...filterLevels];

  if (req.user.role === 'teacher') {
    query += ' AND u.grade = ? AND u.class = ?';
    params.push(req.user.grade, req.user.class);
  }

  query += `
    AND r.created_at = (
      SELECT MAX(r2.created_at)
      FROM assessment_results r2
      JOIN assessment_records rec2 ON r2.record_id = rec2.id
      WHERE rec2.student_id = u.id
    )
    ORDER BY 
      CASE r.risk_level 
        WHEN 'severe' THEN 1 
        WHEN 'moderate' THEN 2 
        WHEN 'mild' THEN 3 
        ELSE 4 
      END,
      r.total_score DESC
  `;

  const students = db.prepare(query).all(...params);
  res.json(students);
});

router.put('/:id/notes', requireRole('admin', 'psychologist'), (req, res) => {
  const { analysis_notes } = req.body;

  const result = db.prepare('SELECT * FROM assessment_results WHERE id = ?').get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: '结果不存在' });
  }

  db.prepare('UPDATE assessment_results SET analysis_notes = ? WHERE id = ?')
    .run(analysis_notes || '', req.params.id);

  const updated = db.prepare('SELECT * FROM assessment_results WHERE id = ?').get(req.params.id);
  updated.dimension_scores = JSON.parse(updated.dimension_scores);

  res.json(updated);
});

module.exports = router;
