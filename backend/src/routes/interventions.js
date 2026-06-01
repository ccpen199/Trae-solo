const express = require('express');
const { db } = require('../database');
const { requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', requireRole('admin', 'psychologist', 'teacher'), (req, res) => {
  const { student_id, is_closed } = req.query;
  let query = `
    SELECT i.*, u.name as student_name, u.grade, u.class,
           creator.name as creator_name, creator.role as creator_role
    FROM interventions i
    JOIN users u ON i.student_id = u.id
    JOIN users creator ON i.created_by = creator.id
    WHERE 1=1
  `;
  const params = [];

  if (student_id) {
    query += ' AND i.student_id = ?';
    params.push(student_id);
  }

  if (is_closed !== undefined) {
    query += ' AND i.is_closed = ?';
    params.push(is_closed === 'true' ? 1 : 0);
  }

  if (req.user.role === 'teacher') {
    query += ' AND u.grade = ? AND u.class = ?';
    params.push(req.user.grade, req.user.class);
  }

  query += ' ORDER BY i.created_at DESC';

  const interventions = db.prepare(query).all(...params);

  interventions.forEach(i => {
    i.is_closed = i.is_closed === 1;
  });

  res.json(interventions);
});

router.get('/:id', (req, res) => {
  const intervention = db.prepare(`
    SELECT i.*, u.name as student_name, u.grade, u.class,
           creator.name as creator_name, creator.role as creator_role,
           r.risk_level, r.total_score, p.name as plan_name
    FROM interventions i
    JOIN users u ON i.student_id = u.id
    JOIN users creator ON i.created_by = creator.id
    LEFT JOIN assessment_results r ON i.result_id = r.id
    LEFT JOIN assessment_records rec ON r.record_id = rec.id
    LEFT JOIN assessment_plans p ON rec.plan_id = p.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!intervention) {
    return res.status(404).json({ error: '干预记录不存在' });
  }

  if (req.user.role === 'teacher') {
    if (intervention.grade !== req.user.grade || intervention.class !== req.user.class) {
      return res.status(403).json({ error: '权限不足' });
    }
  }

  intervention.is_closed = intervention.is_closed === 1;

  res.json(intervention);
});

router.post('/', requireRole('admin', 'psychologist', 'teacher'), [
  body('student_id').isInt(),
  body('type').isIn(['interview', 'referral', 'parent_communication', 'follow_up']),
  body('content').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { student_id, result_id, type, content, outcome } = req.body;

  if (req.user.role === 'teacher') {
    const student = db.prepare('SELECT grade, class FROM users WHERE id = ?').get(student_id);
    if (!student || student.grade !== req.user.grade || student.class !== req.user.class) {
      return res.status(403).json({ error: '权限不足，只能干预本班学生' });
    }
  }

  const result = db.prepare(`
    INSERT INTO interventions (student_id, result_id, type, content, outcome, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    student_id,
    result_id || null,
    type,
    content,
    outcome || '',
    req.user.id
  );

  const intervention = db.prepare('SELECT * FROM interventions WHERE id = ?').get(result.lastInsertRowid);
  intervention.is_closed = intervention.is_closed === 1;

  res.status(201).json(intervention);
});

router.put('/:id', requireRole('admin', 'psychologist', 'teacher'), [
  body('type').optional().isIn(['interview', 'referral', 'parent_communication', 'follow_up']),
  body('content').optional().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const intervention = db.prepare('SELECT * FROM interventions WHERE id = ?').get(req.params.id);
  if (!intervention) {
    return res.status(404).json({ error: '干预记录不存在' });
  }

  if (req.user.role === 'teacher') {
    const student = db.prepare('SELECT grade, class FROM users WHERE id = ?').get(intervention.student_id);
    if (!student || student.grade !== req.user.grade || student.class !== req.user.class) {
      return res.status(403).json({ error: '权限不足' });
    }
  }

  const { type, content, outcome } = req.body;

  db.prepare(`
    UPDATE interventions 
    SET type = COALESCE(?, type),
        content = COALESCE(?, content),
        outcome = COALESCE(?, outcome),
        updated_at = ?
    WHERE id = ?
  `).run(
    type,
    content,
    outcome,
    new Date().toISOString(),
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM interventions WHERE id = ?').get(req.params.id);
  updated.is_closed = updated.is_closed === 1;

  res.json(updated);
});

router.post('/:id/close', requireRole('admin', 'psychologist'), (req, res) => {
  const intervention = db.prepare('SELECT * FROM interventions WHERE id = ?').get(req.params.id);
  if (!intervention) {
    return res.status(404).json({ error: '干预记录不存在' });
  }

  const result = db.prepare(`
    SELECT r.risk_level 
    FROM assessment_results r 
    WHERE r.id = (SELECT result_id FROM interventions WHERE id = ?)
  `).get(req.params.id);

  if (result && (result.risk_level === 'severe' || result.risk_level === 'moderate')) {
    const openInterventions = db.prepare(`
      SELECT COUNT(*) as count 
      FROM interventions 
      WHERE student_id = ? AND is_closed = 0 AND id != ?
    `).get(intervention.student_id, req.params.id);

    if (openInterventions.count === 0) {
      return res.status(400).json({ 
        error: '高风险学生不能静默关闭，请创建后续跟进记录后再关闭此记录',
        requireFollowUp: true
      });
    }
  }

  db.prepare('UPDATE interventions SET is_closed = 1, updated_at = ? WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);

  const updated = db.prepare('SELECT * FROM interventions WHERE id = ?').get(req.params.id);
  updated.is_closed = updated.is_closed === 1;

  res.json(updated);
});

router.delete('/:id', requireRole('admin', 'psychologist'), (req, res) => {
  const intervention = db.prepare('SELECT * FROM interventions WHERE id = ?').get(req.params.id);
  if (!intervention) {
    return res.status(404).json({ error: '干预记录不存在' });
  }

  db.prepare('DELETE FROM interventions WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
