const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const db = new Database(path.join(__dirname, '../database/training.db'));

router.get('/course/:courseId', authenticate, (req, res) => {
  const exams = db.prepare('SELECT * FROM exams WHERE course_id = ?').all(req.params.courseId);
  res.json(exams);
});

router.get('/:id', authenticate, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: '考试不存在' });
  }
  
  const questions = db.prepare('SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY sort_order, id').all(req.params.id);
  questions.forEach(q => {
    q.options = JSON.parse(q.options);
  });
  
  exam.questions = questions;
  
  const attempts = db.prepare('SELECT * FROM exam_attempts WHERE exam_id = ? AND user_id = ? ORDER BY attempt_number').all(req.params.id, req.user.id);
  exam.my_attempts = attempts;
  
  res.json(exam);
});

router.post('/', authenticate, requireRole('admin', 'instructor'), (req, res) => {
  const { course_id, title, description, duration, passing_score, max_attempts, questions } = req.body;
  
  const result = db.prepare(`
    INSERT INTO exams (course_id, title, description, duration, passing_score, max_attempts, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(course_id, title, description, duration, passing_score, max_attempts, req.user.id);
  
  const examId = result.lastInsertRowid;
  const insertQuestion = db.prepare(`
    INSERT INTO exam_questions (exam_id, type, question, options, answer, score, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  questions.forEach((q, index) => {
    insertQuestion.run(examId, q.type, q.question, JSON.stringify(q.options), q.answer, q.score, index);
  });
  
  res.json({ id: examId, message: '考试创建成功' });
});

router.post('/:id/start', authenticate, (req, res) => {
  const examId = req.params.id;
  const userId = req.user.id;
  
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) {
    return res.status(404).json({ error: '考试不存在' });
  }
  
  const attempts = db.prepare('SELECT COUNT(*) as count FROM exam_attempts WHERE exam_id = ? AND user_id = ?').get(examId, userId);
  
  if (attempts.count >= exam.max_attempts) {
    return res.status(400).json({ error: '已达到最大考试次数' });
  }
  
  const attemptNumber = attempts.count + 1;
  
  db.prepare(`
    INSERT INTO exam_attempts (exam_id, user_id, attempt_number, started_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(examId, userId, attemptNumber);
  
  res.json({ attempt_number: attemptNumber, message: '考试开始' });
});

router.post('/:id/submit', authenticate, (req, res) => {
  const examId = req.params.id;
  const userId = req.user.id;
  const { answers, attempt_number } = req.body;
  
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  const questions = db.prepare('SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY sort_order, id').all(examId);
  
  let score = 0;
  questions.forEach((q, index) => {
    if (answers[index] === q.answer) {
      score += q.score;
    }
  });
  
  const is_passed = score >= exam.passing_score;
  
  db.prepare(`
    UPDATE exam_attempts 
    SET score = ?, answers = ?, submitted_at = CURRENT_TIMESTAMP, is_passed = ?
    WHERE exam_id = ? AND user_id = ? AND attempt_number = ?
  `).run(score, JSON.stringify(answers), is_passed ? 1 : 0, examId, userId, attempt_number);
  
  if (is_passed) {
    const certificateNo = 'CERT' + Date.now() + userId;
    db.prepare(`
      INSERT INTO certificates (user_id, course_id, exam_id, certificate_no)
      VALUES (?, ?, ?, ?)
    `).run(userId, exam.course_id, examId, certificateNo);
    
    db.prepare(`
      UPDATE course_enrollments 
      SET status = 'completed', progress = 100, completed_at = CURRENT_TIMESTAMP
      WHERE course_id = ? AND user_id = ?
    `).run(exam.course_id, userId);
  }
  
  res.json({ score, is_passed, message: is_passed ? '考试通过' : '未通过' });
});

router.get('/:id/results', authenticate, requireRole('admin', 'hr', 'instructor'), (req, res) => {
  const results = db.prepare(`
    SELECT ea.*, u.name, u.department, u.position
    FROM exam_attempts ea
    JOIN users u ON ea.user_id = u.id
    WHERE ea.exam_id = ? AND ea.submitted_at IS NOT NULL
    ORDER BY ea.score DESC
  `).all(req.params.id);
  res.json(results);
});

module.exports = router;
