const express = require('express');
const { db } = require('../database');
const { requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT p.*, s.name as scale_name, u.name as creator_name
    FROM assessment_plans p
    LEFT JOIN scales s ON p.scale_id = s.id
    LEFT JOIN users u ON p.created_by = u.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE p.status = ?';
    params.push(status);
  }

  if (req.user.role === 'student') {
    const studentGrades = [req.user.grade];
    if (query.includes('WHERE')) {
      query += ' AND (';
    } else {
      query += ' WHERE (';
    }
    query += ' p.grades LIKE ? OR p.grades LIKE ? OR p.grades LIKE ?)';
    params.push(`%${req.user.grade}%`, `%[${req.user.grade}%`, `%${req.user.grade}]%`);
  }

  if (req.user.role === 'teacher') {
    if (query.includes('WHERE')) {
      query += ' AND (';
    } else {
      query += ' WHERE (';
    }
    query += ' p.grades LIKE ? OR p.grades LIKE ? OR p.grades LIKE ?)';
    params.push(`%${req.user.grade}%`, `%[${req.user.grade}%`, `%${req.user.grade}]%`);
  }

  query += ' ORDER BY p.created_at DESC';

  const plans = db.prepare(query).all(...params);
  
  plans.forEach(plan => {
    plan.grades = JSON.parse(plan.grades);
  });

  res.json(plans);
});

router.get('/:id', (req, res) => {
  const plan = db.prepare(`
    SELECT p.*, s.name as scale_name, s.questions, s.dimensions, s.scoring_rules, s.risk_thresholds, u.name as creator_name
    FROM assessment_plans p
    LEFT JOIN scales s ON p.scale_id = s.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!plan) {
    return res.status(404).json({ error: '测评计划不存在' });
  }

  plan.grades = JSON.parse(plan.grades);
  if (plan.questions) plan.questions = JSON.parse(plan.questions);
  if (plan.dimensions) plan.dimensions = JSON.parse(plan.dimensions);
  if (plan.scoring_rules) plan.scoring_rules = JSON.parse(plan.scoring_rules);
  if (plan.risk_thresholds) plan.risk_thresholds = JSON.parse(plan.risk_thresholds);

  res.json(plan);
});

router.post('/', requireRole('admin', 'psychologist'), [
  body('name').notEmpty(),
  body('scale_id').isInt(),
  body('grades').isArray(),
  body('start_time').notEmpty(),
  body('end_time').notEmpty(),
  body('consent_text').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, status } = req.body;

  const scale = db.prepare('SELECT * FROM scales WHERE id = ?').get(scale_id);
  if (!scale) {
    return res.status(404).json({ error: '量表不存在' });
  }

  const result = db.prepare(`
    INSERT INTO assessment_plans (name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    scale_id,
    JSON.stringify(grades),
    start_time,
    end_time,
    is_anonymous ? 1 : 0,
    consent_text,
    req.user.id,
    status || 'draft'
  );

  const plan = db.prepare('SELECT * FROM assessment_plans WHERE id = ?').get(result.lastInsertRowid);
  plan.grades = JSON.parse(plan.grades);

  res.status(201).json(plan);
});

router.put('/:id', requireRole('admin', 'psychologist'), [
  body('name').optional().notEmpty(),
  body('grades').optional().isArray(),
  body('start_time').optional().notEmpty(),
  body('end_time').optional().notEmpty(),
  body('consent_text').optional().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const plan = db.prepare('SELECT * FROM assessment_plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: '测评计划不存在' });
  }

  const { name, scale_id, grades, start_time, end_time, is_anonymous, consent_text, status } = req.body;

  db.prepare(`
    UPDATE assessment_plans 
    SET name = COALESCE(?, name),
        scale_id = COALESCE(?, scale_id),
        grades = COALESCE(?, grades),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        is_anonymous = COALESCE(?, is_anonymous),
        consent_text = COALESCE(?, consent_text),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(
    name,
    scale_id,
    grades ? JSON.stringify(grades) : undefined,
    start_time,
    end_time,
    is_anonymous !== undefined ? (is_anonymous ? 1 : 0) : undefined,
    consent_text,
    status,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM assessment_plans WHERE id = ?').get(req.params.id);
  updated.grades = JSON.parse(updated.grades);

  res.json(updated);
});

router.delete('/:id', requireRole('admin', 'psychologist'), (req, res) => {
  const plan = db.prepare('SELECT * FROM assessment_plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: '测评计划不存在' });
  }

  const recordCount = db.prepare('SELECT COUNT(*) as count FROM assessment_records WHERE plan_id = ?').get(req.params.id);
  if (recordCount.count > 0) {
    return res.status(400).json({ error: '该计划已有测评记录，无法删除' });
  }

  db.prepare('DELETE FROM assessment_plans WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.post('/:id/consent', (req, res) => {
  const plan = db.prepare('SELECT * FROM assessment_plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: '测评计划不存在' });
  }

  const { consented } = req.body;

  const anonymousId = plan.is_anonymous ? `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

  db.prepare(`
    INSERT INTO consent_logs (plan_id, student_id, anonymous_id, consented, consented_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    req.user.id,
    anonymousId,
    consented ? 1 : 0,
    consented ? new Date().toISOString() : null
  );

  if (consented) {
    const existing = db.prepare('SELECT * FROM assessment_records WHERE plan_id = ? AND student_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      db.prepare(`
        INSERT INTO assessment_records (plan_id, student_id, anonymous_id, answers, progress, status)
        VALUES (?, ?, ?, '{}', 0, 'incomplete')
      `).run(req.params.id, req.user.id, anonymousId);
    }
  }

  res.json({ consented, anonymousId });
});

router.get('/:id/consent-status', (req, res) => {
  const consent = db.prepare(`
    SELECT * FROM consent_logs 
    WHERE plan_id = ? AND student_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(req.params.id, req.user.id);

  res.json({
    consented: consent ? consent.consented === 1 : false,
    anonymous_id: consent ? consent.anonymous_id : null
  });
});

module.exports = router;
