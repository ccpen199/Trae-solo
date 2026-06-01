const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { role, id } = req.user;
  let exams;

  if (role === 'admin' || role === 'invigilator') {
    exams = db.prepare(`
      SELECT e.*, u.name as creator_name,
        COUNT(DISTINCT es.student_id) as student_count,
        COUNT(DISTINCT CASE WHEN es.status = 'submitted' THEN es.student_id END) as submitted_count
      FROM exams e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN exam_students es ON e.id = es.exam_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `).all();
  } else {
    exams = db.prepare(`
      SELECT e.*, es.status as exam_status, es.score
      FROM exams e
      JOIN exam_students es ON e.id = es.exam_id
      WHERE es.student_id = ?
      ORDER BY e.created_at DESC
    `).all(id);
  }

  res.json({ exams });
});

router.get('/:id', authenticateToken, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  
  if (!exam) {
    return res.status(404).json({ error: '考试不存在' });
  }

  const questions = db.prepare('SELECT * FROM questions WHERE exam_id = ?').all(req.params.id);
  exam.questions = questions;

  res.json({ exam });
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  const {
    title, description, start_time, end_time, duration,
    max_screen_switches, require_camera, allow_late_minutes,
    allowed_devices, questions
  } = req.body;

  if (!title || !start_time || !end_time || !duration) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const insertExam = db.prepare(`
    INSERT INTO exams (
      title, description, start_time, end_time, duration,
      max_screen_switches, require_camera, allow_late_minutes,
      allowed_devices, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertExam.run(
    title, description, start_time, end_time, duration,
    max_screen_switches || 5, require_camera ? 1 : 0,
    allow_late_minutes || 0, allowed_devices || 'desktop',
    req.user.id
  );

  const examId = result.lastInsertRowid;

  if (questions && questions.length > 0) {
    const insertQuestion = db.prepare(`
      INSERT INTO questions (exam_id, type, content, options, correct_answer, score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const q of questions) {
      insertQuestion.run(
        examId, q.type, q.content,
        JSON.stringify(q.options || []),
        JSON.stringify(q.correct_answer || ''),
        q.score || 10
      );
    }
  }

  res.json({ id: examId, message: '考试创建成功' });
});

router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  
  if (!exam) {
    return res.status(404).json({ error: '考试不存在' });
  }

  if (exam.status === 'published' || exam.status === 'ended') {
    return res.status(400).json({ error: '已发布或已结束的考试不能修改' });
  }

  const {
    title, description, start_time, end_time, duration,
    max_screen_switches, require_camera, allow_late_minutes,
    allowed_devices, questions
  } = req.body;

  db.prepare(`
    UPDATE exams SET
      title = ?, description = ?, start_time = ?, end_time = ?,
      duration = ?, max_screen_switches = ?, require_camera = ?,
      allow_late_minutes = ?, allowed_devices = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title, description, start_time, end_time, duration,
    max_screen_switches, require_camera ? 1 : 0,
    allow_late_minutes, allowed_devices, req.params.id
  );

  if (questions) {
    db.prepare('DELETE FROM questions WHERE exam_id = ?').run(req.params.id);
    
    const insertQuestion = db.prepare(`
      INSERT INTO questions (exam_id, type, content, options, correct_answer, score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const q of questions) {
      insertQuestion.run(
        req.params.id, q.type, q.content,
        JSON.stringify(q.options || []),
        JSON.stringify(q.correct_answer || ''),
        q.score || 10
      );
    }
  }

  res.json({ message: '考试更新成功' });
});

router.post('/:id/publish', authenticateToken, requireRole('admin'), (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  
  if (!exam) {
    return res.status(404).json({ error: '考试不存在' });
  }

  if (exam.status !== 'draft') {
    return res.status(400).json({ error: '只能发布草稿状态的考试' });
  }

  db.prepare('UPDATE exams SET status = ? WHERE id = ?').run('published', req.params.id);
  res.json({ message: '考试发布成功' });
});

router.post('/:id/assign-students', authenticateToken, requireRole('admin'), (req, res) => {
  const { student_ids } = req.body;
  const examId = req.params.id;

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) {
    return res.status(404).json({ error: '考试不存在' });
  }

  const insertExamStudent = db.prepare(`
    INSERT OR IGNORE INTO exam_students (exam_id, student_id)
    VALUES (?, ?)
  `);

  for (const studentId of student_ids) {
    insertExamStudent.run(examId, studentId);
  }

  res.json({ message: '考生分配成功' });
});

router.get('/:id/students', authenticateToken, requireRole('admin', 'invigilator'), (req, res) => {
  const students = db.prepare(`
    SELECT es.*, u.name, u.username,
      COUNT(a.id) as answered_count,
      COUNT(DISTINCT an.id) as anomaly_count
    FROM exam_students es
    JOIN users u ON es.student_id = u.id
    LEFT JOIN answers a ON es.id = a.exam_student_id
    LEFT JOIN anomalies an ON es.id = an.exam_student_id
    WHERE es.exam_id = ?
    GROUP BY es.id
  `).all(req.params.id);

  res.json({ students });
});

module.exports = router;
