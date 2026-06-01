import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const questionnaires = db.prepare('SELECT * FROM questionnaires ORDER BY created_at DESC').all();
  res.json(questionnaires);
});

router.get('/:id', (req, res) => {
  const questionnaire = db.prepare('SELECT * FROM questionnaires WHERE id = ?').get(req.params.id);
  if (!questionnaire) {
    return res.status(404).json({ error: '问卷不存在' });
  }
  res.json(questionnaire);
});

router.get('/:id/questions', (req, res) => {
  const questions = db.prepare('SELECT * FROM questions WHERE questionnaire_id = ? ORDER BY category, id').all(req.params.id);
  res.json(questions);
});

router.post('/', (req, res) => {
  const { name, version, description } = req.body;

  const result = db.prepare(`
    INSERT INTO questionnaires (name, version, description)
    VALUES (?, ?, ?)
  `).run(name, version, description);

  const questionnaire = db.prepare('SELECT * FROM questionnaires WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(questionnaire);
});

router.post('/:id/questions', (req, res) => {
  const { category, question_text, weight, applicable_industries, scoring_rule, max_score, requires_evidence } = req.body;

  const result = db.prepare(`
    INSERT INTO questions (questionnaire_id, category, question_text, weight, applicable_industries, scoring_rule, max_score, requires_evidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, category, question_text, weight || 1, applicable_industries, scoring_rule, max_score || 10, requires_evidence ? 1 : 0);

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(question);
});

router.put('/questions/:id', (req, res) => {
  const { category, question_text, weight, applicable_industries, scoring_rule, max_score, requires_evidence } = req.body;

  db.prepare(`
    UPDATE questions SET
      category = ?, question_text = ?, weight = ?, applicable_industries = ?,
      scoring_rule = ?, max_score = ?, requires_evidence = ?
    WHERE id = ?
  `).run(category, question_text, weight, applicable_industries, scoring_rule, max_score, requires_evidence ? 1 : 0, req.params.id);

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  res.json(question);
});

router.delete('/questions/:id', (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

export default router;
