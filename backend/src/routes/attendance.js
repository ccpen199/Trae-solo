const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/course/:courseId', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const { courseId } = req.params;
  const { date } = req.query;

  if (req.user.role === 'teacher') {
    const course = db.prepare('SELECT teacher_id FROM courses WHERE id = ?').get(courseId);
    if (!course || course.teacher_id !== req.user.id) {
      return res.status(403).json({ error: '只能查看自己授课课程的签到' });
    }
  }

  let query = `
    SELECT a.*, 
           u.name as student_name,
           (SELECT name FROM grades WHERE id = (SELECT grade_id FROM users WHERE id = a.student_id)) as grade_name
    FROM attendance a
    LEFT JOIN users u ON a.student_id = u.id
    WHERE a.course_id = ?
  `;
  const params = [courseId];

  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }

  query += ' ORDER BY a.date DESC, a.created_at DESC';

  const attendance = db.prepare(query).all(...params);
  res.json(attendance);
});

router.post('/course/:courseId/batch', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const { courseId } = req.params;
  const { date, records } = req.body;

  if (req.user.role === 'teacher') {
    const course = db.prepare('SELECT teacher_id FROM courses WHERE id = ?').get(courseId);
    if (!course || course.teacher_id !== req.user.id) {
      return res.status(403).json({ error: '只能为自己授课的课程签到' });
    }
  }

  const enrollments = db.prepare(`
    SELECT id, student_id FROM enrollments 
    WHERE course_id = ? AND status = 'enrolled'
  `).all(courseId);

  const enrollmentMap = new Map(enrollments.map(e => [e.student_id, e.id]));

  const findExisting = db.prepare(`
    SELECT id FROM attendance 
    WHERE enrollment_id = ? AND date = ?
  `);

  const insertStmt = db.prepare(`
    INSERT INTO attendance (enrollment_id, course_id, student_id, date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE attendance SET status = ?, notes = ? WHERE id = ?
  `);

  const insertMany = db.transaction((records) => {
    for (const record of records) {
      const enrollmentId = enrollmentMap.get(record.student_id);
      if (enrollmentId) {
        const existing = findExisting.get(enrollmentId, date);
        if (existing) {
          updateStmt.run(record.status, record.notes || '', existing.id);
        } else {
          insertStmt.run(
            enrollmentId,
            courseId,
            record.student_id,
            date,
            record.status,
            record.notes || ''
          );
        }
      }
    }
  });

  insertMany(records);

  const absentRecords = records.filter(r => r.status === 'absent');
  if (absentRecords.length > 0) {
    const insertNotification = db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const course = db.prepare('SELECT name FROM courses WHERE id = ?').get(courseId);

    absentRecords.forEach(record => {
      const student = db.prepare('SELECT parent_id, name FROM users WHERE id = ?').get(record.student_id);
      if (student && student.parent_id) {
        insertNotification.run(
          student.parent_id,
          'absent_alert',
          '缺勤提醒',
          `您的孩子${student.name}在${date}的课程《${course.name}》中缺勤，请关注。`,
          courseId,
          'attendance'
        );
      }
    });
  }

  res.json({ message: '签到记录保存成功' });
});

router.get('/student/:studentId', authenticateToken, (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'parent') {
    const child = db.prepare('SELECT id FROM users WHERE parent_id = ? AND id = ?').get(req.user.id, studentId);
    if (!child) {
      return res.status(403).json({ error: '只能查看自己孩子的签到记录' });
    }
  }

  if (req.user.role === 'student' && studentId != req.user.id) {
    return res.status(403).json({ error: '只能查看自己的签到记录' });
  }

  const attendance = db.prepare(`
    SELECT a.*, 
           c.name as course_name,
           u.name as teacher_name
    FROM attendance a
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE a.student_id = ?
    ORDER BY a.date DESC
  `).all(studentId);

  res.json(attendance);
});

router.post('/:id/notify', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const attendanceId = req.params.id;

  const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(attendanceId);
  if (!attendance) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  if (attendance.notified_parent) {
    return res.status(400).json({ error: '已发送过通知' });
  }

  const student = db.prepare('SELECT parent_id, name FROM users WHERE id = ?').get(attendance.student_id);
  const course = db.prepare('SELECT name FROM courses WHERE id = ?').get(attendance.course_id);

  if (student && student.parent_id) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      student.parent_id,
      'absent_alert',
      '缺勤提醒',
      `您的孩子${student.name}在${attendance.date}的课程《${course.name}》中${attendance.status === 'absent' ? '缺勤' : attendance.status === 'late' ? '迟到' : '请假'}。`,
      attendance.id,
      'attendance'
    );

    db.prepare('UPDATE attendance SET notified_parent = 1 WHERE id = ?').run(attendanceId);
    res.json({ message: '通知已发送' });
  } else {
    res.status(400).json({ error: '未找到家长信息' });
  }
});

module.exports = router;
