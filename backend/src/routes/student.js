const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/verify-identity/:examId', authenticateToken, requireRole('student'), (req, res) => {
  const examId = req.params.examId;
  const studentId = req.user.id;

  const examStudent = db.prepare(`
    SELECT * FROM exam_students WHERE exam_id = ? AND student_id = ?
  `).get(examId, studentId);

  if (!examStudent) {
    return res.status(403).json({ error: '您未被分配到此考试' });
  }

  const { identity_data } = req.body;
  
  db.prepare(`
    UPDATE exam_students SET identity_verified = 1
    WHERE exam_id = ? AND student_id = ?
  `).run(examId, studentId);

  db.prepare(`
    INSERT INTO activity_logs (exam_student_id, action, details)
    VALUES (?, ?, ?)
  `).run(examStudent.id, 'identity_verify', '身份核验通过');

  res.json({ message: '身份核验成功' });
});

router.post('/check-device/:examId', authenticateToken, requireRole('student'), (req, res) => {
  const examId = req.params.examId;
  const studentId = req.user.id;

  const examStudent = db.prepare(`
    SELECT * FROM exam_students WHERE exam_id = ? AND student_id = ?
  `).get(examId, studentId);

  if (!examStudent) {
    return res.status(403).json({ error: '您未被分配到此考试' });
  }

  const { device_info } = req.body;

  db.prepare(`
    UPDATE exam_students SET device_checked = 1
    WHERE exam_id = ? AND student_id = ?
  `).run(examId, studentId);

  db.prepare(`
    INSERT INTO activity_logs (exam_student_id, action, details)
    VALUES (?, ?, ?)
  `).run(examStudent.id, 'device_check', JSON.stringify(device_info));

  res.json({ message: '设备检测成功' });
});

router.post('/accept-promise/:examId', authenticateToken, requireRole('student'), (req, res) => {
  const examId = req.params.examId;
  const studentId = req.user.id;

  const examStudent = db.prepare(`
    SELECT * FROM exam_students WHERE exam_id = ? AND student_id = ?
  `).get(examId, studentId);

  if (!examStudent) {
    return res.status(403).json({ error: '您未被分配到此考试' });
  }

  db.prepare(`
    UPDATE exam_students SET promise_accepted = 1
    WHERE exam_id = ? AND student_id = ?
  `).run(examId, studentId);

  db.prepare(`
    INSERT INTO activity_logs (exam_student_id, action, details)
    VALUES (?, ?, ?)
  `).run(examStudent.id, 'promise_accept', '已接受诚信考试承诺');

  res.json({ message: '承诺确认成功' });
});

router.post('/enter-exam/:examId', authenticateToken, requireRole('student'), (req, res) => {
  const examId = req.params.examId;
  const studentId = req.user.id;

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) {
    return res.status(404).json({ error: '考试不存在' });
  }

  const examStudent = db.prepare(`
    SELECT * FROM exam_students WHERE exam_id = ? AND student_id = ?
  `).get(examId, studentId);

  if (!examStudent) {
    return res.status(403).json({ error: '您未被分配到此考试' });
  }

  if (!examStudent.identity_verified || !examStudent.device_checked || !examStudent.promise_accepted) {
    return res.status(400).json({ error: '请先完成身份核验、设备检测和承诺确认' });
  }

  const now = new Date();
  const startTime = new Date(exam.start_time);
  const endTime = new Date(exam.end_time);
  const lateMinutes = (now - startTime) / 60000;

  if (now < startTime) {
    return res.status(400).json({ error: '考试尚未开始' });
  }

  if (lateMinutes > exam.allow_late_minutes) {
    return res.status(400).json({ error: '已超过允许迟到时间' });
  }

  if (now > endTime) {
    return res.status(400).json({ error: '考试已结束' });
  }

  db.prepare(`
    UPDATE exam_students 
    SET status = 'in_progress', entered_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(examStudent.id);

  db.prepare(`
    INSERT INTO activity_logs (exam_student_id, action, details)
    VALUES (?, ?, ?)
  `).run(examStudent.id, 'enter_exam', `进入考试，迟到${Math.round(lateMinutes)}分钟`);

  if (lateMinutes > 0) {
    db.prepare(`
      INSERT INTO anomalies (exam_student_id, type, description, risk_score)
      VALUES (?, ?, ?, ?)
    `).run(examStudent.id, 'late_entry', `迟到${Math.round(lateMinutes)}分钟`, 10);
  }

  const questions = db.prepare(`
    SELECT id, type, content, options, score FROM questions WHERE exam_id = ?
  `).all(examId);

  res.json({
    message: '进入考试成功',
    examStudentId: examStudent.id,
    questions,
    endTime: exam.end_time
  });
});

router.post('/submit-answer/:examStudentId', authenticateToken, requireRole('student'), (req, res) => {
  const examStudentId = req.params.examStudentId;
  const { question_id, answer } = req.body;

  const examStudent = db.prepare(`
    SELECT es.*, e.end_time
    FROM exam_students es
    JOIN exams e ON es.exam_id = e.id
    WHERE es.id = ? AND es.student_id = ?
  `).get(examStudentId, req.user.id);

  if (!examStudent) {
    return res.status(404).json({ error: '考试记录不存在' });
  }

  if (examStudent.status !== 'in_progress') {
    return res.status(400).json({ error: '考试未进行中' });
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(question_id);
  if (!question) {
    return res.status(404).json({ error: '题目不存在' });
  }

  let isCorrect = false;
  let score = 0;

  if (question.type !== 'essay') {
    const correctAnswer = JSON.parse(question.correct_answer || '[]');
    const userAnswer = Array.isArray(answer) ? answer : [answer];
    
    if (question.type === 'single') {
      isCorrect = JSON.stringify(correctAnswer) === JSON.stringify(userAnswer);
    } else if (question.type === 'multiple') {
      const sortedCorrect = [...correctAnswer].sort();
      const sortedUser = [...userAnswer].sort();
      isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser);
    }
    score = isCorrect ? question.score : 0;
  }

  db.prepare(`
    INSERT OR REPLACE INTO answers 
    (exam_student_id, question_id, answer, is_correct, score)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    examStudentId, question_id,
    JSON.stringify(answer),
    isCorrect ? 1 : 0,
    score
  );

  res.json({ message: '答案提交成功' });
});

router.post('/submit-exam/:examStudentId', authenticateToken, requireRole('student'), (req, res) => {
  const examStudentId = req.params.examStudentId;

  const examStudent = db.prepare(`
    SELECT * FROM exam_students WHERE id = ? AND student_id = ?
  `).get(examStudentId, req.user.id);

  if (!examStudent) {
    return res.status(404).json({ error: '考试记录不存在' });
  }

  const answers = db.prepare(`
    SELECT SUM(score) as total_score FROM answers WHERE exam_student_id = ?
  `).get(examStudentId);

  db.prepare(`
    UPDATE exam_students 
    SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, score = ?
    WHERE id = ?
  `).run(answers.total_score || 0, examStudentId);

  db.prepare(`
    INSERT INTO activity_logs (exam_student_id, action, details)
    VALUES (?, ?, ?)
  `).run(examStudentId, 'submit_exam', `交卷完成，得分: ${answers.total_score || 0}`);

  res.json({ message: '交卷成功', score: answers.total_score || 0 });
});

module.exports = router;
