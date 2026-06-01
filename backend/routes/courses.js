const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const db = new Database(path.join(__dirname, '../database/training.db'));

router.get('/', authenticate, (req, res) => {
  const { status, is_required } = req.query;
  let sql = `
    SELECT c.*, u.name as instructor_name, u.department as instructor_department
    FROM courses c 
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (is_required !== undefined) {
    sql += ' AND c.is_required = ?';
    params.push(is_required);
  }
  
  const courses = db.prepare(sql).all(...params);
  res.json(courses);
});

router.get('/my-courses', authenticate, (req, res) => {
  const courses = db.prepare(`
    SELECT 
      c.*, 
      u.name as instructor_name, 
      ce.status as enrollment_status, 
      ce.progress,
      ce.enrolled_at,
      ce.completed_at,
      a.status as attendance_status,
      a.is_late,
      (SELECT MAX(score) FROM exam_attempts ea JOIN exams e ON ea.exam_id = e.id WHERE e.course_id = c.id AND ea.user_id = ?) as exam_score,
      (SELECT COUNT(*) FROM exam_attempts ea JOIN exams e ON ea.exam_id = e.id WHERE e.course_id = c.id AND ea.user_id = ? AND ea.is_passed = 1) > 0 as exam_passed,
      cert.certificate_no
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    LEFT JOIN users u ON c.instructor_id = u.id
    LEFT JOIN attendances a ON c.id = a.course_id AND ce.user_id = a.user_id
    LEFT JOIN certificates cert ON c.id = cert.course_id AND ce.user_id = cert.user_id
    WHERE ce.user_id = ?
    ORDER BY c.live_time DESC
  `).all(req.user.id, req.user.id, req.user.id);
  res.json(courses);
});

router.get('/:id', authenticate, (req, res) => {
  const course = db.prepare(`
    SELECT c.*, u.name as instructor_name, u.department as instructor_department
    FROM courses c 
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }
  
  const enrollment = db.prepare('SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  course.enrolled = !!enrollment;
  course.enrollment_status = enrollment?.status;
  course.progress = enrollment?.progress || 0;
  
  res.json(course);
});

router.post('/', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const { title, description, instructor_id, applicable_positions, registration_scope, live_time, duration, credits, is_required } = req.body;
  
  const result = db.prepare(`
    INSERT INTO courses (title, description, instructor_id, applicable_positions, registration_scope, live_time, duration, credits, is_required, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `).run(title, description, instructor_id, applicable_positions, registration_scope, live_time, duration, credits, is_required ? 1 : 0, req.user.id);
  
  const users = db.prepare('SELECT id FROM users WHERE role = ?').all('employee');
  const enrollStmt = db.prepare('INSERT OR IGNORE INTO course_enrollments (course_id, user_id) VALUES (?, ?)');
  
  users.forEach(u => {
    enrollStmt.run(result.lastInsertRowid, u.id);
  });
  
  res.json({ id: result.lastInsertRowid, message: '课程创建成功' });
});

router.put('/:id', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const { title, description, instructor_id, applicable_positions, registration_scope, live_time, duration, credits, is_required, status } = req.body;
  
  db.prepare(`
    UPDATE courses 
    SET title = ?, description = ?, instructor_id = ?, applicable_positions = ?, registration_scope = ?, 
        live_time = ?, duration = ?, credits = ?, is_required = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, instructor_id, applicable_positions, registration_scope, live_time, duration, credits, is_required ? 1 : 0, status, req.params.id);
  
  res.json({ message: '课程更新成功' });
});

router.post('/:id/enroll', authenticate, (req, res) => {
  try {
    db.prepare('INSERT INTO course_enrollments (course_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
    res.json({ message: '报名成功' });
  } catch (error) {
    res.status(400).json({ error: '已报名该课程' });
  }
});

router.get('/:id/enrollments', authenticate, requireRole('admin', 'hr', 'instructor'), (req, res) => {
  const enrollments = db.prepare(`
    SELECT ce.*, u.name, u.department, u.position, a.status as attendance_status
    FROM course_enrollments ce
    JOIN users u ON ce.user_id = u.id
    LEFT JOIN attendances a ON a.course_id = ce.course_id AND a.user_id = ce.user_id
    WHERE ce.course_id = ?
  `).all(req.params.id);
  res.json(enrollments);
});

router.get('/my-certificates', authenticate, (req, res) => {
  const certificates = db.prepare(`
    SELECT cert.*, c.title as course_title, c.credits, e.score as exam_score
    FROM certificates cert
    JOIN courses c ON cert.course_id = c.id
    LEFT JOIN exam_attempts e ON cert.exam_id = e.exam_id AND e.user_id = cert.user_id AND e.is_passed = 1
    WHERE cert.user_id = ?
    ORDER BY cert.issued_at DESC
  `).all(req.user.id);
  res.json(certificates);
});

module.exports = router;
