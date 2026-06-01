const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const db = new Database(path.join(__dirname, '../database/training.db'));

router.get('/statistics', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('employee').count;
  const totalEnrollments = db.prepare('SELECT COUNT(*) as count FROM course_enrollments').get().count;
  const completedCourses = db.prepare('SELECT COUNT(*) as count FROM course_enrollments WHERE status = ?').get('completed').count;
  const totalCertificates = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  
  const totalExamAttempts = db.prepare('SELECT COUNT(*) as count FROM exam_attempts WHERE submitted_at IS NOT NULL').get().count;
  const passedExamAttempts = db.prepare('SELECT COUNT(*) as count FROM exam_attempts WHERE is_passed = 1').get().count;
  
  const departmentStats = db.prepare(`
    SELECT 
      u.department,
      COUNT(DISTINCT u.id) as total_employees,
      COUNT(DISTINCT ce.id) as total_enrollments,
      COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.id END) as completed_count,
      ROUND(COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.id END) * 100.0 / NULLIF(COUNT(DISTINCT ce.id), 0), 1) as dept_completion_rate
    FROM users u
    LEFT JOIN course_enrollments ce ON u.id = ce.user_id
    WHERE u.role = 'employee'
    GROUP BY u.department
  `).all();
  
  const courseStats = db.prepare(`
    SELECT 
      c.id,
      c.title,
      c.credits,
      c.is_required,
      COUNT(DISTINCT ce.user_id) as enrolled_count,
      COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.user_id END) as attended_count,
      COUNT(DISTINCT CASE WHEN a.is_late = 1 THEN a.user_id END) as late_count,
      COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.user_id END) as completed_count,
      ROUND(COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.user_id END) * 100.0 / NULLIF(COUNT(DISTINCT ce.user_id), 0), 1) as completion_rate,
      (SELECT COUNT(*) FROM exam_attempts ea JOIN exams e ON ea.exam_id = e.id WHERE e.course_id = c.id) as exam_attempts,
      (SELECT COUNT(*) FROM exam_attempts ea JOIN exams e ON ea.exam_id = e.id WHERE e.course_id = c.id AND ea.is_passed = 1) as exam_passed
    FROM courses c
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id
    LEFT JOIN attendances a ON c.id = a.course_id AND ce.user_id = a.user_id
    GROUP BY c.id
  `).all();
  
  const absentees = db.prepare(`
    SELECT 
      c.id as course_id,
      c.title as course_title,
      u.id as user_id,
      u.name,
      u.department,
      u.position,
      ce.enrolled_at
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    JOIN users u ON ce.user_id = u.id
    LEFT JOIN attendances a ON ce.course_id = a.course_id AND ce.user_id = a.user_id
    WHERE c.status = 'completed' AND (a.status IS NULL OR a.status != 'present')
  `).all();
  
  const examStats = db.prepare(`
    SELECT 
      e.id,
      e.title,
      c.title as course_title,
      COUNT(DISTINCT ea.user_id) as total_participants,
      COUNT(DISTINCT CASE WHEN ea.is_passed = 1 THEN ea.user_id END) as passed_count,
      ROUND(AVG(ea.score), 1) as avg_score,
      MIN(ea.score) as min_score,
      MAX(ea.score) as max_score
    FROM exams e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.submitted_at IS NOT NULL
    GROUP BY e.id
  `).all();
  
  res.json({
    totalCourses,
    totalUsers,
    totalEnrollments,
    completedCourses,
    totalCertificates,
    completionRate: totalEnrollments > 0 ? (completedCourses / totalEnrollments * 100).toFixed(1) : 0,
    examPassRate: totalExamAttempts > 0 ? (passedExamAttempts / totalExamAttempts * 100).toFixed(1) : 0,
    departmentStats,
    courseStats,
    absentees,
    examStats
  });
});

router.get('/evaluations', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const evaluations = db.prepare(`
    SELECT ce.*, c.title as course_title, u.name as user_name, u.department
    FROM course_evaluations ce
    JOIN courses c ON ce.course_id = c.id
    JOIN users u ON ce.user_id = u.id
    ORDER BY ce.created_at DESC
  `).all();
  res.json(evaluations);
});

router.post('/evaluations', authenticate, (req, res) => {
  const { course_id, rating, comment } = req.body;
  try {
    db.prepare(`
      INSERT INTO course_evaluations (course_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(course_id, req.user.id, rating, comment);
    res.json({ message: '评价提交成功' });
  } catch (error) {
    res.status(400).json({ error: '已评价过该课程' });
  }
});

router.get('/certificates', authenticate, (req, res) => {
  const certificates = db.prepare(`
    SELECT cert.*, c.title as course_title, u.name as user_name
    FROM certificates cert
    JOIN courses c ON cert.course_id = c.id
    JOIN users u ON cert.user_id = u.id
    ${req.user.role === 'employee' ? 'WHERE cert.user_id = ' + req.user.id : ''}
    ORDER BY cert.issued_at DESC
  `).all();
  res.json(certificates);
});

router.get('/exceptions', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const exceptions = db.prepare(`
    SELECT e.*, c.title as course_title, u.name as user_name, h.name as handler_name
    FROM exceptions e
    LEFT JOIN courses c ON e.course_id = c.id
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN users h ON e.handled_by = h.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(exceptions);
});

router.post('/exceptions/:id/handle', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const { handling_result } = req.body;
  db.prepare(`
    UPDATE exceptions 
    SET status = 'handled', handled_by = ?, handled_at = CURRENT_TIMESTAMP, handling_result = ?
    WHERE id = ?
  `).run(req.user.id, handling_result, req.params.id);
  res.json({ message: '异常处理完成' });
});

router.get('/export/training-records', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const records = db.prepare(`
    SELECT 
      u.name,
      u.department,
      u.position,
      c.title as course_title,
      c.credits,
      c.is_required,
      ce.status as enrollment_status,
      a.status as attendance_status,
      a.is_late,
      ea.score as exam_score,
      ea.is_passed,
      cert.certificate_no,
      ce.enrolled_at,
      ce.completed_at
    FROM users u
    LEFT JOIN course_enrollments ce ON u.id = ce.user_id
    LEFT JOIN courses c ON ce.course_id = c.id
    LEFT JOIN attendances a ON ce.course_id = a.course_id AND ce.user_id = a.user_id
    LEFT JOIN exam_attempts ea ON c.id = (SELECT course_id FROM exams WHERE id = ea.exam_id) AND ea.user_id = u.id AND ea.is_passed = 1
    LEFT JOIN certificates cert ON ce.course_id = cert.course_id AND ce.user_id = cert.user_id
    WHERE u.role = 'employee'
    ORDER BY u.department, u.name, ce.enrolled_at
  `).all();
  
  res.json(records);
});

router.get('/notifications', authenticate, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(req.user.id);
  res.json(notifications);
});

router.post('/notifications/:id/read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: '已标记已读' });
});

router.get('/users', authenticate, requireRole('admin', 'hr'), (req, res) => {
  const users = db.prepare(`
    SELECT id, username, name, email, role, department, position, created_at
    FROM users
    ORDER BY department, name
  `).all();
  res.json(users);
});

module.exports = router;
