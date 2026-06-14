const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function parseJsonField(field) {
  try {
    return field ? JSON.parse(field) : [];
  } catch {
    return [];
  }
}

router.get('/', (req, res) => {
  const { page = 1, limit = 20, category, difficulty, sort = 'popular' } = req.query;
  const offset = (page - 1) * limit;

  let where = ['status = ?'];
  let params = ['active'];

  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (difficulty) {
    where.push('difficulty = ?');
    params.push(difficulty);
  }

  const whereClause = 'WHERE ' + where.join(' AND ');
  const orderBy = sort === 'popular' ? 'total_score DESC' :
                  sort === 'newest' ? 'created_at DESC' : 'id DESC';

  const quizzes = db.prepare(`
    SELECT q.*, 
      (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempt_count
    FROM quizzes q
    ${whereClause}
    ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM quizzes ${whereClause}`).get(...params);

  res.json({
    data: quizzes,
    total: total.count,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const quiz = db.prepare(`
    SELECT q.*, 
      (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempt_count
    FROM quizzes q
    WHERE q.id = ?
  `).get(req.params.id);

  if (!quiz) {
    return res.status(404).json({ error: '答题活动不存在' });
  }

  const questions = db.prepare(`
    SELECT * FROM questions WHERE quiz_id = ? ORDER BY sort_order ASC
  `).all(req.params.id).map(q => ({
    ...q,
    options: parseJsonField(q.options)
  }));

  res.json({ quiz, questions });
});

router.post('/:id/attempt', authenticateToken, (req, res) => {
  const { answers } = req.body;

  const questions = db.prepare(`
    SELECT * FROM questions WHERE quiz_id = ? ORDER BY sort_order ASC
  `).all(req.params.id);

  let score = 0;
  let correct_count = 0;
  const results = [];

  questions.forEach((q, index) => {
    const userAnswer = answers[index];
    const isCorrect = userAnswer === q.correct_answer;
    if (isCorrect) {
      score += q.points;
      correct_count++;
    }
    results.push({
      question_id: q.id,
      user_answer: userAnswer,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
      points: isCorrect ? q.points : 0
    });
  });

  const attemptResult = db.prepare(`
    INSERT INTO quiz_attempts 
    (quiz_id, user_id, score, correct_count, total_questions, completed_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(req.params.id, req.user.id, score, correct_count, questions.length);

  const existing = db.prepare('SELECT id FROM leaderboard WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare(`
      UPDATE leaderboard SET
        total_score = total_score + ?,
        quizzes_completed = quizzes_completed + 1,
        accuracy_rate = (
          SELECT AVG(CAST(correct_count AS FLOAT) / total_questions) * 100
          FROM quiz_attempts WHERE user_id = ?
        ),
        last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(score, req.user.id, req.user.id);
  } else {
    db.prepare(`
      INSERT INTO leaderboard 
      (user_id, total_score, quizzes_completed, accuracy_rate)
      VALUES (?, ?, 1, ?)
    `).run(req.user.id, score, (correct_count / questions.length) * 100);
  }

  const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ?').get(attemptResult.lastInsertRowid);

  res.json({
    attempt,
    score,
    correct_count,
    total_questions: questions.length,
    results
  });
});

router.get('/leaderboard', (req, res) => {
  const { limit = 20, quiz_id } = req.query;

  let where = '';
  let params = [];

  if (quiz_id) {
    where = 'WHERE l.quiz_id = ?';
    params.push(quiz_id);
  }

  const leaderboard = db.prepare(`
    SELECT l.*, u.username, u.avatar
    FROM leaderboard l
    JOIN users u ON l.user_id = u.id
    ${where}
    ORDER BY l.total_score DESC
    LIMIT ?
  `).all(...params, parseInt(limit));

  res.json({ leaderboard });
});

router.get('/prizes', (req, res) => {
  const prizes = db.prepare(`
    SELECT * FROM prizes WHERE status = 'active' ORDER BY required_score ASC
  `).all();

  res.json({ prizes });
});

router.post('/prizes/:id/redeem', authenticateToken, async (req, res) => {
  const prize = db.prepare('SELECT * FROM prizes WHERE id = ?').get(req.params.id);
  if (!prize || prize.status !== 'active') {
    return res.status(404).json({ error: '奖品不存在或已下架' });
  }

  if (prize.stock <= 0) {
    return res.status(400).json({ error: '奖品库存不足' });
  }

  const userScore = db.prepare(`
    SELECT COALESCE(SUM(total_score), 0) as total_score FROM leaderboard WHERE user_id = ?
  `).get(req.user.id);

  if (userScore.total_score < prize.required_score) {
    return res.status(400).json({ error: '积分不足' });
  }

  const redemptionCode = 'CINE' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();

  db.prepare(`
    INSERT INTO prize_redemptions 
    (user_id, prize_id, redemption_code, status)
    VALUES (?, ?, ?, 'processing')
  `).run(req.user.id, req.params.id, redemptionCode);

  db.prepare('UPDATE prizes SET stock = stock - 1 WHERE id = ?').run(req.params.id);

  res.json({
    success: true,
    redemption_code: redemptionCode,
    message: '兑换申请已提交，请等待审核'
  });
});

router.post('/', authenticateToken, requireRole(['admin', 'moderator']), (req, res) => {
  const {
    title, description, category, difficulty, time_limit,
    cover_url, questions
  } = req.body;

  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: '请填写标题和题目' });
  }

  const totalScore = questions.reduce((sum, q) => sum + (q.points || 10), 0);

  const result = db.prepare(`
    INSERT INTO quizzes 
    (title, description, category, difficulty, question_count, total_score, 
     time_limit, cover_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, description || null, category || null, difficulty || 'medium',
    questions.length, totalScore, time_limit || 600, cover_url || null, req.user.id
  );

  const quizId = result.lastInsertRowid;

  const insertQuestion = db.prepare(`
    INSERT INTO questions 
    (quiz_id, question_text, question_type, options, correct_answer, 
     explanation, points, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  questions.forEach((q, index) => {
    insertQuestion.run(
      quizId, q.question_text, q.question_type || 'single',
      JSON.stringify(q.options || []), q.correct_answer,
      q.explanation || null, q.points || 10, index + 1
    );
  });

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
  res.status(201).json({ quiz });
});

module.exports = router;
