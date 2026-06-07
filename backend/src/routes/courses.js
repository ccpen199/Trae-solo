const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const { category, difficulty } = req.query;
    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (difficulty) {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }
    sql += ' ORDER BY created_at DESC';
    const courses = db.prepare(sql).all(...params);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, description, instructor_id, category, duration_minutes, difficulty, cover_image } = req.body;
    const result = db.prepare(
      'INSERT INTO courses (title, description, instructor_id, category, duration_minutes, difficulty, cover_image) VALUES (?,?,?,?,?,?,?)'
    ).run(title, description, instructor_id, category, duration_minutes, difficulty, cover_image);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/enrollments', (req, res) => {
  try {
    const { user_id } = req.query;
    let sql = 'SELECT e.*, c.title as course_title, c.category, c.difficulty FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE 1=1';
    const params = [];
    if (user_id) {
      sql += ' AND e.user_id = ?';
      params.push(user_id);
    }
    sql += ' ORDER BY e.enrolled_at DESC';
    const enrollments = db.prepare(sql).all(...params);
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/enrollments/:id/progress', (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percent } = req.body;
    db.prepare('UPDATE enrollments SET progress_percent = ? WHERE id = ?').run(progress_percent, id);
    if (progress_percent >= 100) {
      db.prepare('UPDATE enrollments SET completed_at = CURRENT_TIMESTAMP WHERE id = ? AND completed_at IS NULL').run(id);
    }
    res.json({ id: Number(id), progress_percent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lesson-progress', (req, res) => {
  try {
    const { enrollment_id, lesson_id, status } = req.body;
    const existing = db.prepare('SELECT id FROM lesson_progress WHERE enrollment_id = ? AND lesson_id = ?').get(enrollment_id, lesson_id);
    if (existing) {
      db.prepare(
        "UPDATE lesson_progress SET status = ?, completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE enrollment_id = ? AND lesson_id = ?"
      ).run(status, status, enrollment_id, lesson_id);
      res.json({ id: existing.id, updated: true });
    } else {
      const result = db.prepare(
        "INSERT INTO lesson_progress (enrollment_id, lesson_id, status, completed_at) VALUES (?,?,?,CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)"
      ).run(enrollment_id, lesson_id, status, status);
      res.status(201).json({ id: result.lastInsertRowid });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/certification-exams', (req, res) => {
  try {
    const exams = db.prepare('SELECT * FROM certification_exams ORDER BY created_at DESC').all();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/certification-exams/:id', (req, res) => {
  try {
    const exam = db.prepare('SELECT * FROM certification_exams WHERE id = ?').get(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    exam.questions = JSON.parse(exam.questions);
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/certification-exams/:id/attempt', (req, res) => {
  try {
    const { technician_id, answers } = req.body;
    const exam = db.prepare('SELECT * FROM certification_exams WHERE id = ?').get(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    const questions = JSON.parse(exam.questions);
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    const score = (correct / questions.length) * 100;
    const passed = score >= exam.passing_score ? 1 : 0;
    const result = db.prepare(
      'INSERT INTO exam_attempts (exam_id, technician_id, answers, score, passed) VALUES (?,?,?,?,?)'
    ).run(req.params.id, technician_id, JSON.stringify(answers), score, passed);
    if (passed) {
      db.prepare(
        'INSERT INTO certifications (technician_id, cert_name, cert_type, exam_score, issued_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)'
      ).run(technician_id, exam.cert_name, 'exam', score);
    }
    res.status(201).json({
      attempt_id: result.lastInsertRowid,
      score,
      passed: !!passed,
      correct,
      total: questions.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/certifications', (req, res) => {
  try {
    const { technician_id } = req.query;
    let sql = 'SELECT * FROM certifications WHERE 1=1';
    const params = [];
    if (technician_id) {
      sql += ' AND technician_id = ?';
      params.push(technician_id);
    }
    sql += ' ORDER BY issued_at DESC';
    const certs = db.prepare(sql).all(...params);
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const lessons = db.prepare('SELECT * FROM course_lessons WHERE course_id = ? ORDER BY sort_order').all(req.params.id);
    course.lessons = lessons;
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/enroll', (req, res) => {
  try {
    const { user_id } = req.body;
    const result = db.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?,?)').run(user_id, req.params.id);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
