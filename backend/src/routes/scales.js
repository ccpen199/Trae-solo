const express = require('express');
const { db } = require('../database');
const { requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', (req, res) => {
  const scales = db.prepare(`
    SELECT s.*, u.name as creator_name
    FROM scales s
    LEFT JOIN users u ON s.created_by = u.id
    ORDER BY s.created_at DESC
  `).all();

  scales.forEach(scale => {
    scale.questions = JSON.parse(scale.questions);
    scale.dimensions = JSON.parse(scale.dimensions);
    scale.scoring_rules = JSON.parse(scale.scoring_rules);
    scale.risk_thresholds = JSON.parse(scale.risk_thresholds);
  });

  res.json(scales);
});

router.get('/:id', (req, res) => {
  const scale = db.prepare(`
    SELECT s.*, u.name as creator_name
    FROM scales s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!scale) {
    return res.status(404).json({ error: '量表不存在' });
  }

  scale.questions = JSON.parse(scale.questions);
  scale.dimensions = JSON.parse(scale.dimensions);
  scale.scoring_rules = JSON.parse(scale.scoring_rules);
  scale.risk_thresholds = JSON.parse(scale.risk_thresholds);

  res.json(scale);
});

router.post('/', requireRole('admin', 'psychologist'), [
  body('name').notEmpty(),
  body('questions').isArray(),
  body('dimensions').isArray(),
  body('scoring_rules').isObject(),
  body('risk_thresholds').isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, questions, dimensions, scoring_rules, risk_thresholds } = req.body;

  const result = db.prepare(`
    INSERT INTO scales (name, description, questions, dimensions, scoring_rules, risk_thresholds, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    description || '',
    JSON.stringify(questions),
    JSON.stringify(dimensions),
    JSON.stringify(scoring_rules),
    JSON.stringify(risk_thresholds),
    req.user.id
  );

  const scale = db.prepare('SELECT * FROM scales WHERE id = ?').get(result.lastInsertRowid);
  scale.questions = JSON.parse(scale.questions);
  scale.dimensions = JSON.parse(scale.dimensions);
  scale.scoring_rules = JSON.parse(scale.scoring_rules);
  scale.risk_thresholds = JSON.parse(scale.risk_thresholds);

  res.status(201).json(scale);
});

router.put('/:id', requireRole('admin', 'psychologist'), [
  body('name').optional().notEmpty(),
  body('questions').optional().isArray(),
  body('dimensions').optional().isArray(),
  body('scoring_rules').optional().isObject(),
  body('risk_thresholds').optional().isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const scale = db.prepare('SELECT * FROM scales WHERE id = ?').get(req.params.id);
  if (!scale) {
    return res.status(404).json({ error: '量表不存在' });
  }

  const { name, description, questions, dimensions, scoring_rules, risk_thresholds } = req.body;

  db.prepare(`
    UPDATE scales 
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        questions = COALESCE(?, questions),
        dimensions = COALESCE(?, dimensions),
        scoring_rules = COALESCE(?, scoring_rules),
        risk_thresholds = COALESCE(?, risk_thresholds)
    WHERE id = ?
  `).run(
    name,
    description,
    questions ? JSON.stringify(questions) : undefined,
    dimensions ? JSON.stringify(dimensions) : undefined,
    scoring_rules ? JSON.stringify(scoring_rules) : undefined,
    risk_thresholds ? JSON.stringify(risk_thresholds) : undefined,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM scales WHERE id = ?').get(req.params.id);
  updated.questions = JSON.parse(updated.questions);
  updated.dimensions = JSON.parse(updated.dimensions);
  updated.scoring_rules = JSON.parse(updated.scoring_rules);
  updated.risk_thresholds = JSON.parse(updated.risk_thresholds);

  res.json(updated);
});

router.delete('/:id', requireRole('admin', 'psychologist'), (req, res) => {
  const scale = db.prepare('SELECT * FROM scales WHERE id = ?').get(req.params.id);
  if (!scale) {
    return res.status(404).json({ error: '量表不存在' });
  }

  const planCount = db.prepare('SELECT COUNT(*) as count FROM assessment_plans WHERE scale_id = ?').get(req.params.id);
  if (planCount.count > 0) {
    return res.status(400).json({ error: '该量表已被测评计划使用，无法删除' });
  }

  db.prepare('DELETE FROM scales WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
