const express = require('express');
const { db } = require('../database');
const { requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const calculateScore = (answers, questions, dimensions, scoringRules) => {
  const dimensionScores = {};
  let totalScore = 0;

  Object.keys(dimensions).forEach(key => {
    dimensionScores[key] = {
      score: 0,
      count: 0,
      maxScore: 0,
      label: dimensions[key]
    };
  });

  questions.forEach(q => {
    const answer = answers[q.id];
    if (answer !== undefined && answer !== null) {
      const dim = dimensionScores[q.dimension];
      if (dim) {
        let score = parseInt(answer);
        if (q.reverse) {
          score = 3 - score;
        }
        dim.score += score;
        dim.count += 1;
        dim.maxScore += 3;
      }
      totalScore += score;
    }
  });

  Object.keys(dimensionScores).forEach(key => {
    const dim = dimensionScores[key];
    if (dim.count > 0) {
      dim.avgScore = dim.score / dim.count;
      dim.percentage = (dim.score / dim.maxScore) * 100;
    }
  });

  return {
    totalScore,
    dimensionScores
  };
};

const determineRiskLevel = (totalScore, thresholds) => {
  if (totalScore >= thresholds.severe.min) return 'severe';
  if (totalScore >= thresholds.moderate.min) return 'moderate';
  if (totalScore >= thresholds.mild.min) return 'mild';
  return 'normal';
};

router.get('/my-assessments', requireRole('student'), (req, res) => {
  const records = db.prepare(`
    SELECT r.*, p.name as plan_name, p.scale_id, s.name as scale_name, p.end_time
    FROM assessment_records r
    JOIN assessment_plans p ON r.plan_id = p.id
    JOIN scales s ON p.scale_id = s.id
    WHERE r.student_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);

  records.forEach(r => {
    if (r.answers) r.answers = JSON.parse(r.answers);
  });

  res.json(records);
});

router.get('/record/:id', (req, res) => {
  const record = db.prepare(`
    SELECT r.*, p.name as plan_name, p.scale_id, s.name as scale_name, s.questions, s.dimensions, p.is_anonymous
    FROM assessment_records r
    JOIN assessment_plans p ON r.plan_id = p.id
    JOIN scales s ON p.scale_id = s.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!record) {
    return res.status(404).json({ error: '测评记录不存在' });
  }

  if (req.user.role === 'student' && record.student_id !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  if (req.user.role === 'teacher') {
    const student = db.prepare('SELECT grade, class FROM users WHERE id = ?').get(record.student_id);
    if (!student || student.grade !== req.user.grade || student.class !== req.user.class) {
      return res.status(403).json({ error: '权限不足' });
    }
  }

  if (record.answers) record.answers = JSON.parse(record.answers);
  if (record.questions) record.questions = JSON.parse(record.questions);
  if (record.dimensions) record.dimensions = JSON.parse(record.dimensions);

  if (record.is_anonymous) {
    delete record.student_id;
  }

  res.json(record);
});

router.post('/record/:id/save', requireRole('student'), [
  body('answers').isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const record = db.prepare('SELECT * FROM assessment_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '测评记录不存在' });
  }

  if (record.student_id !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  if (record.status === 'submitted') {
    return res.status(400).json({ error: '测评已提交，无法修改' });
  }

  const { answers } = req.body;
  const plan = db.prepare('SELECT s.questions FROM assessment_plans p JOIN scales s ON p.scale_id = s.id WHERE p.id = ?').get(record.plan_id);
  const questions = JSON.parse(plan.questions);
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== '').length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  db.prepare(`
    UPDATE assessment_records 
    SET answers = ?, progress = ?
    WHERE id = ?
  `).run(JSON.stringify(answers), progress, req.params.id);

  const updated = db.prepare('SELECT * FROM assessment_records WHERE id = ?').get(req.params.id);
  updated.answers = JSON.parse(updated.answers);

  res.json(updated);
});

router.post('/record/:id/submit', requireRole('student'), [
  body('answers').isObject()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const record = db.prepare('SELECT * FROM assessment_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '测评记录不存在' });
  }

  if (record.student_id !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  if (record.status === 'submitted') {
    return res.status(400).json({ error: '测评已提交' });
  }

  const plan = db.prepare(`
    SELECT p.start_time, p.end_time, s.questions, s.dimensions, s.scoring_rules, s.risk_thresholds
    FROM assessment_plans p 
    JOIN scales s ON p.scale_id = s.id 
    WHERE p.id = ?
  `).get(record.plan_id);

  const now = new Date();
  if (now < new Date(plan.start_time) || now > new Date(plan.end_time)) {
    return res.status(400).json({ error: '不在测评时间范围内' });
  }

  const { answers } = req.body;
  const questions = JSON.parse(plan.questions);
  const unanswered = questions.filter(q => answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '');

  let abnormalReason = null;
  const startTime = new Date(record.start_time);
  const durationSeconds = Math.floor((now - startTime) / 1000);
  const expectedMinSeconds = questions.length * 3;

  if (durationSeconds < expectedMinSeconds) {
    abnormalReason = `答题时间过短（${durationSeconds}秒）`;
  } else if (unanswered.length > 0) {
    abnormalReason = `有${unanswered.length}题未作答`;
  }

  const previousSubmit = db.prepare(`
    SELECT COUNT(*) as count FROM assessment_records 
    WHERE plan_id = ? AND student_id = ? AND status = 'submitted'
  `).get(record.plan_id, req.user.id);

  if (previousSubmit.count > 0) {
    abnormalReason = abnormalReason ? `${abnormalReason}，重复提交` : '重复提交';
  }

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== '').length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const { totalScore, dimensionScores } = calculateScore(
    answers,
    questions,
    JSON.parse(plan.dimensions),
    JSON.parse(plan.scoring_rules)
  );

  const thresholds = JSON.parse(plan.risk_thresholds);
  const riskLevel = determineRiskLevel(totalScore, thresholds);

  db.prepare(`
    UPDATE assessment_records 
    SET answers = ?, progress = ?, status = ?, submit_time = ?, duration_seconds = ?, abnormal_reason = ?
    WHERE id = ?
  `).run(
    JSON.stringify(answers),
    progress,
    abnormalReason ? 'abnormal' : 'submitted',
    now.toISOString(),
    durationSeconds,
    abnormalReason,
    req.params.id
  );

  const result = db.prepare(`
    INSERT INTO assessment_results (record_id, total_score, dimension_scores, risk_level, risk_factors)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    totalScore,
    JSON.stringify(dimensionScores),
    riskLevel,
    JSON.stringify({ unanswered: unanswered.map(q => q.id), durationSeconds })
  );

  if (riskLevel === 'severe' || riskLevel === 'moderate') {
    const psychologists = db.prepare("SELECT id FROM users WHERE role = 'psychologist'").all();
    psychologists.forEach(psych => {
      db.prepare(`
        INSERT INTO todos (type, related_id, assignee_id, title, description, priority, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'intervention',
        result.lastInsertRowid,
        psych.id,
        `高风险学生需要干预 - ${riskLevel === 'severe' ? '严重' : '中度'}`,
        `学生测评结果为${riskLevel === 'severe' ? '严重风险' : '中度风险'}，请及时跟进干预。记录ID: ${req.params.id}`,
        riskLevel === 'severe' ? 'urgent' : 'high',
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      );
    });
  }

  const updatedRecord = db.prepare('SELECT * FROM assessment_records WHERE id = ?').get(req.params.id);
  updatedRecord.answers = JSON.parse(updatedRecord.answers);

  res.json({
    record: updatedRecord,
    result: {
      id: result.lastInsertRowid,
      totalScore,
      dimensionScores,
      riskLevel
    }
  });
});

router.get('/plan/:plan_id/my-record', requireRole('student'), (req, res) => {
  let record = db.prepare(`
    SELECT r.*, p.name as plan_name, p.scale_id, s.name as scale_name, s.questions, s.dimensions, s.scoring_rules
    FROM assessment_records r
    JOIN assessment_plans p ON r.plan_id = p.id
    JOIN scales s ON p.scale_id = s.id
    WHERE r.plan_id = ? AND r.student_id = ?
    ORDER BY r.created_at DESC
    LIMIT 1
  `).get(req.params.plan_id, req.user.id);

  if (!record) {
    const plan = db.prepare('SELECT * FROM assessment_plans WHERE id = ?').get(req.params.plan_id);
    if (!plan) {
      return res.status(404).json({ error: '测评计划不存在' });
    }
    
    const consent = db.prepare('SELECT * FROM consent_logs WHERE plan_id = ? AND student_id = ?')
      .get(req.params.plan_id, req.user.id);
    
    if (!consent || !consent.consented) {
      return res.status(400).json({ error: '请先签署知情同意书' });
    }

    const info = db.prepare(`
      INSERT INTO assessment_records (plan_id, student_id, anonymous_id, answers, progress, status, start_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.plan_id,
      req.user.id,
      consent.anonymous_id,
      JSON.stringify({}),
      0,
      'incomplete',
      new Date().toISOString()
    );

    record = db.prepare(`
      SELECT r.*, p.name as plan_name, p.scale_id, s.name as scale_name, s.questions, s.dimensions, s.scoring_rules
      FROM assessment_records r
      JOIN assessment_plans p ON r.plan_id = p.id
      JOIN scales s ON p.scale_id = s.id
      WHERE r.id = ?
    `).get(info.lastInsertRowid);
  }

  if (record.answers) record.answers = JSON.parse(record.answers);
  if (record.questions) record.questions = JSON.parse(record.questions);
  if (record.dimensions) record.dimensions = JSON.parse(record.dimensions);
  if (record.scoring_rules) record.scoring_rules = JSON.parse(record.scoring_rules);

  res.json(record);
});

router.get('/plan/:plan_id/records', requireRole('admin', 'psychologist', 'teacher'), (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT r.*, u.name as student_name, u.grade, u.class, p.name as plan_name, s.name as scale_name
    FROM assessment_records r
    JOIN users u ON r.student_id = u.id
    JOIN assessment_plans p ON r.plan_id = p.id
    JOIN scales s ON p.scale_id = s.id
    WHERE r.plan_id = ?
  `;
  const params = [req.params.plan_id];

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  if (req.user.role === 'teacher') {
    query += ' AND u.grade = ? AND u.class = ?';
    params.push(req.user.grade, req.user.class);
  }

  query += ' ORDER BY r.created_at DESC';

  const records = db.prepare(query).all(...params);

  records.forEach(r => {
    if (r.answers) r.answers = JSON.parse(r.answers);
  });

  res.json(records);
});

module.exports = router;
