import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { supplier_id, status } = req.query;
  
  let query = `
    SELECT a.*, s.name as supplier_name, q.name as questionnaire_name, q.version as questionnaire_version
    FROM assessments a
    JOIN suppliers s ON a.supplier_id = s.id
    JOIN questionnaires q ON a.questionnaire_id = q.id
    WHERE 1=1
  `;
  const params = [];

  if (supplier_id) {
    query += ' AND a.supplier_id = ?';
    params.push(supplier_id);
  }
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  query += ' ORDER BY a.created_at DESC';

  const assessments = db.prepare(query).all(...params);
  res.json(assessments);
});

router.get('/:id', (req, res) => {
  const assessment = db.prepare(`
    SELECT a.*, s.name as supplier_name, q.name as questionnaire_name, q.version as questionnaire_version
    FROM assessments a
    JOIN suppliers s ON a.supplier_id = s.id
    JOIN questionnaires q ON a.questionnaire_id = q.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!assessment) {
    return res.status(404).json({ error: '评估不存在' });
  }
  res.json(assessment);
});

router.get('/:id/answers', (req, res) => {
  const answers = db.prepare(`
    SELECT aa.*, q.category, q.question_text, q.weight, q.scoring_rule, q.max_score, q.requires_evidence, q.options
    FROM assessment_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.assessment_id = ?
    ORDER BY q.category, q.id
  `).all(req.params.id);
  res.json(answers);
});

router.post('/', (req, res) => {
  const { supplier_id, questionnaire_id } = req.body;

  const existing = db.prepare(`
    SELECT id FROM assessments WHERE supplier_id = ? AND questionnaire_id = ? AND status IN ('draft', 'in_progress')
  `).get(supplier_id, questionnaire_id);

  if (existing) {
    return res.status(400).json({ error: '该供应商已有进行中的评估' });
  }

  const result = db.prepare(`
    INSERT INTO assessments (supplier_id, questionnaire_id, status)
    VALUES (?, ?, 'draft')
  `).run(supplier_id, questionnaire_id);

  const questions = db.prepare('SELECT id FROM questions WHERE questionnaire_id = ?').all(questionnaire_id);
  const insertAnswer = db.prepare(`
    INSERT INTO assessment_answers (assessment_id, question_id, answer, score, has_evidence)
    VALUES (?, ?, NULL, NULL, 0)
  `);

  questions.forEach(q => {
    insertAnswer.run(result.lastInsertRowid, q.id);
  });

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(assessment);
});

router.post('/:id/answers/:answerId', (req, res) => {
  const { answer, score, has_evidence } = req.body;

  db.prepare(`
    UPDATE assessment_answers SET answer = ?, score = ?, has_evidence = ? WHERE id = ?
  `).run(answer, score, has_evidence ? 1 : 0, req.params.answerId);

  const updatedAnswer = db.prepare('SELECT * FROM assessment_answers WHERE id = ?').get(req.params.answerId);
  res.json(updatedAnswer);
});

function calculateRiskLevel(score) {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function calculateNextReviewDate() {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear.toISOString().split('T')[0];
}

router.post('/:id/submit', (req, res) => {
  const assessmentId = req.params.id;

  const answers = db.prepare(`
    SELECT aa.*, q.requires_evidence, q.weight, q.max_score
    FROM assessment_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.assessment_id = ?
  `).all(assessmentId);

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let deductionItems = [];

  answers.forEach(answer => {
    if (answer.score !== null) {
      let finalScore = answer.score;
      totalWeight += answer.weight;

      if (answer.requires_evidence && !answer.has_evidence && answer.score === answer.max_score) {
        finalScore = answer.score * 0.5;
        deductionItems.push({
          question_id: answer.question_id,
          reason: '缺少证据支持，满分减半',
          original_score: answer.score,
          final_score: finalScore
        });
      }

      totalWeightedScore += finalScore * answer.weight;
    }
  });

  const finalScore = totalWeight > 0 ? Math.round((totalWeightedScore / (totalWeight * 10)) * 100) : 0;
  const riskLevel = calculateRiskLevel(finalScore);
  const nextReviewDate = calculateNextReviewDate();

  db.prepare(`
    UPDATE assessments SET
      status = 'submitted', total_score = ?, risk_level = ?,
      next_review_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(finalScore, riskLevel, nextReviewDate, assessmentId);

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId);

  const rectifications = deductionItems.map(item => {
    db.prepare(`
      INSERT INTO rectifications (assessment_id, question_id, description, status)
      VALUES (?, ?, ?, 'pending')
    `).run(assessmentId, item.question_id, item.reason);
  });

  res.json({ ...assessment, deduction_items: deductionItems });
});

router.post('/:id/approve', (req, res) => {
  db.prepare(`
    UPDATE assessments SET
      status = 'approved', review_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
  res.json(assessment);
});

router.get('/:id/summary', (req, res) => {
  const assessmentId = req.params.id;

  const answers = db.prepare(`
    SELECT aa.*, q.category, q.question_text, q.scoring_rule, q.max_score, q.requires_evidence
    FROM assessment_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.assessment_id = ?
  `).all(assessmentId);

  const categoryScores = {};
  const deductionItems = [];

  answers.forEach(answer => {
    if (!categoryScores[answer.category]) {
      categoryScores[answer.category] = { total: 0, count: 0 };
    }
    if (answer.score !== null) {
      categoryScores[answer.category].total += answer.score;
      categoryScores[answer.category].count++;
    }

    if (answer.requires_evidence && !answer.has_evidence && answer.score === answer.max_score) {
      deductionItems.push({
        question: answer.question_text,
        category: answer.category,
        reason: '缺少证据支持，满分按50%计算'
      });
    } else if (answer.score !== null && answer.score < answer.max_score) {
      deductionItems.push({
        question: answer.question_text,
        category: answer.category,
        reason: `得分 ${answer.score}/${answer.max_score}，需要改进`
      });
    }
  });

  const rectifications = db.prepare(`
    SELECT r.*, q.question_text
    FROM rectifications r
    LEFT JOIN questions q ON r.question_id = q.id
    WHERE r.assessment_id = ?
  `).all(assessmentId);

  res.json({
    category_scores: categoryScores,
    deduction_items: deductionItems,
    rectifications: rectifications
  });
});

export default router;
