import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { assessment_id, status } = req.query;
  
  let query = `
    SELECT r.*, s.name as supplier_name, q.question_text
    FROM rectifications r
    JOIN assessments a ON r.assessment_id = a.id
    JOIN suppliers s ON a.supplier_id = s.id
    LEFT JOIN questions q ON r.question_id = q.id
    WHERE 1=1
  `;
  const params = [];

  if (assessment_id) {
    query += ' AND r.assessment_id = ?';
    params.push(assessment_id);
  }
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.created_at DESC';

  const rectifications = db.prepare(query).all(...params);
  res.json(rectifications);
});

router.get('/:id', (req, res) => {
  const rectification = db.prepare(`
    SELECT r.*, s.name as supplier_name, q.question_text
    FROM rectifications r
    JOIN assessments a ON r.assessment_id = a.id
    JOIN suppliers s ON a.supplier_id = s.id
    LEFT JOIN questions q ON r.question_id = q.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!rectification) {
    return res.status(404).json({ error: '整改项不存在' });
  }
  res.json(rectification);
});

router.post('/', (req, res) => {
  const { assessment_id, question_id, description, deadline } = req.body;

  const result = db.prepare(`
    INSERT INTO rectifications (assessment_id, question_id, description, deadline, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(assessment_id, question_id || null, description, deadline);

  const rectification = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rectification);
});

router.put('/:id', (req, res) => {
  const { description, deadline, status } = req.body;

  db.prepare(`
    UPDATE rectifications SET description = ?, deadline = ?, status = ? WHERE id = ?
  `).run(description, deadline, status, req.params.id);

  const rectification = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(req.params.id);
  res.json(rectification);
});

router.post('/:id/submit', (req, res) => {
  const { status_evidence } = req.body;

  db.prepare(`
    UPDATE rectifications SET
      status = 'submitted', status_evidence = ?
    WHERE id = ?
  `).run(status_evidence, req.params.id);

  const rectification = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(req.params.id);
  res.json(rectification);
});

router.post('/:id/approve', (req, res) => {
  db.prepare(`
    UPDATE rectifications SET
      status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  const rectification = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(req.params.id);
  res.json(rectification);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM rectifications WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

export default router;
