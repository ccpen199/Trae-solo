const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const hasTimeConflict = (studentId, courseId, dayOfWeek, startTime, endTime) => {
  const enrolledCourses = db.prepare(`
    SELECT c.day_of_week, c.start_time, c.end_time
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = ? AND e.course_id != ? AND e.status = 'enrolled'
  `).all(studentId, courseId);

  for (const course of enrolledCourses) {
    if (course.day_of_week === dayOfWeek) {
      const existingStart = course.start_time;
      const existingEnd = course.end_time;
      
      if ((startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)) {
        return true;
      }
    }
  }
  return false;
};

const generateOrderNo = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

const processWaitlist = (courseId) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course || course.enrolled_count >= course.capacity) return;

  const nextWaitlist = db.prepare(`
    SELECT * FROM enrollments 
    WHERE course_id = ? AND status = 'waitlist' 
    ORDER BY waitlist_position ASC LIMIT 1
  `).get(courseId);

  if (nextWaitlist) {
    db.prepare(`
      UPDATE enrollments 
      SET status = 'enrolled', waitlist_position = NULL, enrolled_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(nextWaitlist.id);

    db.prepare(`
      UPDATE courses 
      SET enrolled_count = enrolled_count + 1, waitlist_count = waitlist_count - 1 
      WHERE id = ?
    `).run(courseId);

    db.prepare(`
      UPDATE enrollments 
      SET waitlist_position = waitlist_position - 1 
      WHERE course_id = ? AND status = 'waitlist' AND waitlist_position > ?
    `).run(courseId, nextWaitlist.waitlist_position);

    const student = db.prepare('SELECT parent_id, name FROM users WHERE id = ?').get(nextWaitlist.student_id);
    if (student && student.parent_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        student.parent_id,
        'waitlist_promoted',
        '候补转正通知',
        `您的孩子${student.name}已从候补转为正式报名课程《${course.name}》`,
        courseId,
        'course'
      );
    }
  }
};

router.get('/', authenticateToken, (req, res) => {
  const { student_id, course_id, status } = req.query;
  let query = `
    SELECT e.*, 
           c.name as course_name, c.day_of_week, c.start_time, c.end_time, c.fee,
           u.name as student_name,
           (SELECT name FROM grades WHERE id = (SELECT grade_id FROM users WHERE id = e.student_id)) as grade_name,
           t.name as teacher_name
    FROM enrollments e
    LEFT JOIN courses c ON e.course_id = c.id
    LEFT JOIN users u ON e.student_id = u.id
    LEFT JOIN users t ON c.teacher_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (student_id) {
    query += ' AND e.student_id = ?';
    params.push(student_id);
  }

  if (course_id) {
    query += ' AND e.course_id = ?';
    params.push(course_id);
  }

  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }

  if (req.user.role === 'parent') {
    const children = db.prepare('SELECT id FROM users WHERE parent_id = ?').all(req.user.id);
    if (children.length > 0) {
      const ids = children.map(c => c.id).join(',');
      query += ` AND e.student_id IN (${ids})`;
    } else {
      return res.json([]);
    }
  }

  if (req.user.role === 'student') {
    query += ' AND e.student_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY e.created_at DESC';

  const enrollments = db.prepare(query).all(...params);
  res.json(enrollments);
});

router.post('/', authenticateToken, (req, res) => {
  const { student_id, course_id } = req.body;

  if (req.user.role === 'student' && student_id !== req.user.id) {
    return res.status(403).json({ error: '只能为自己报名' });
  }

  if (req.user.role === 'parent') {
    const child = db.prepare('SELECT id FROM users WHERE parent_id = ? AND id = ?').get(req.user.id, student_id);
    if (!child) {
      return res.status(403).json({ error: '只能为自己的孩子报名' });
    }
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  if (course.status !== 'published') {
    return res.status(400).json({ error: '课程未发布，无法报名' });
  }

  const student = db.prepare('SELECT * FROM users WHERE id = ?').get(student_id);
  if (!student || student.role !== 'student') {
    return res.status(400).json({ error: '学生不存在' });
  }

  const gradeIds = JSON.parse(course.grade_ids);
  if (!gradeIds.includes(student.grade_id)) {
    return res.status(400).json({ error: '学生年级不符合课程要求' });
  }

  const existing = db.prepare(`
    SELECT * FROM enrollments 
    WHERE student_id = ? AND course_id = ? AND status IN ('enrolled', 'waitlist')
  `).get(student_id, course_id);

  if (existing) {
    return res.status(400).json({ error: '已报名或在候补列表中' });
  }

  if (hasTimeConflict(student_id, course_id, course.day_of_week, course.start_time, course.end_time)) {
    return res.status(400).json({ error: '与已报名课程时间冲突' });
  }

  const unpaidOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE student_id = ? AND status = 'pending' AND type = 'enrollment'
  `).get(student_id);

  if (unpaidOrders.count > 0) {
    return res.status(400).json({ error: '存在未支付的订单，请先完成支付' });
  }

  const isFull = course.enrolled_count >= course.capacity;
  let status = 'enrolled';
  let waitlistPosition = null;

  if (isFull) {
    status = 'waitlist';
    const maxPosition = db.prepare(`
      SELECT MAX(waitlist_position) as max_pos FROM enrollments 
      WHERE course_id = ? AND status = 'waitlist'
    `).get(course_id);
    waitlistPosition = (maxPosition.max_pos || 0) + 1;
  }

  const enrollmentResult = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, status, waitlist_position)
    VALUES (?, ?, ?, ?)
  `).run(student_id, course_id, status, waitlistPosition);

  if (status === 'enrolled') {
    db.prepare('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(course_id);
  } else {
    db.prepare('UPDATE courses SET waitlist_count = waitlist_count + 1 WHERE id = ?').run(course_id);
  }

  if (course.fee > 0) {
    const orderNo = generateOrderNo();
    db.prepare(`
      INSERT INTO orders (order_no, enrollment_id, student_id, course_id, type, amount, status)
      VALUES (?, ?, ?, ?, 'enrollment', ?, 'pending')
    `).run(orderNo, enrollmentResult.lastInsertRowid, student_id, course_id, course.fee);
  }

  res.json({
    id: enrollmentResult.lastInsertRowid,
    status,
    waitlist_position: waitlistPosition,
    message: status === 'enrolled' ? '报名成功' : '已加入候补队列'
  });
});

router.post('/:id/drop', authenticateToken, (req, res) => {
  const enrollmentId = req.params.id;
  const { reason } = req.body;

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId);
  if (!enrollment) {
    return res.status(404).json({ error: '报名记录不存在' });
  }

  if (enrollment.status !== 'enrolled' && enrollment.status !== 'waitlist') {
    return res.status(400).json({ error: '该状态无法退课' });
  }

  if (req.user.role === 'parent') {
    const child = db.prepare('SELECT id FROM users WHERE parent_id = ? AND id = ?').get(req.user.id, enrollment.student_id);
    if (!child) {
      return res.status(403).json({ error: '只能为自己的孩子退课' });
    }
  }

  if (req.user.role === 'student' && enrollment.student_id !== req.user.id) {
    return res.status(403).json({ error: '只能为自己退课' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(enrollment.course_id);
  const wasEnrolled = enrollment.status === 'enrolled';

  db.prepare(`
    UPDATE enrollments 
    SET status = 'dropped', dropped_at = CURRENT_TIMESTAMP, drop_reason = ? 
    WHERE id = ?
  `).run(reason || '主动退课', enrollmentId);

  if (wasEnrolled) {
    db.prepare('UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ?').run(enrollment.course_id);
    processWaitlist(enrollment.course_id);
  } else {
    db.prepare('UPDATE courses SET waitlist_count = waitlist_count - 1 WHERE id = ?').run(enrollment.course_id);
    db.prepare(`
      UPDATE enrollments 
      SET waitlist_position = waitlist_position - 1 
      WHERE course_id = ? AND status = 'waitlist' AND waitlist_position > ?
    `).run(enrollment.course_id, enrollment.waitlist_position);
  }

  if (wasEnrolled && course.fee > 0) {
    const orderNo = generateOrderNo();
    db.prepare(`
      INSERT INTO orders (order_no, enrollment_id, student_id, course_id, type, amount, status, audit_status)
      VALUES (?, ?, ?, ?, 'refund', ?, 'pending', 'pending')
    `).run(orderNo, enrollmentId, enrollment.student_id, enrollment.course_id, course.fee);
  }

  res.json({ message: '退课成功' });
});

router.post('/:id/pay', authenticateToken, (req, res) => {
  const enrollmentId = req.params.id;
  const { payment_method } = req.body;

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId);
  if (!enrollment) {
    return res.status(404).json({ error: '报名记录不存在' });
  }

  const order = db.prepare(`
    SELECT * FROM orders 
    WHERE enrollment_id = ? AND type = 'enrollment' AND status = 'pending'
  `).get(enrollmentId);

  if (!order) {
    return res.status(400).json({ error: '没有待支付的订单' });
  }

  const success = Math.random() > 0.1;

  if (success) {
    db.prepare(`
      UPDATE orders 
      SET status = 'paid', payment_method = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(payment_method || 'online', `TXN${Date.now()}`, order.id);

    res.json({ message: '支付成功' });
  } else {
    db.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").run(order.id);
    res.status(400).json({ error: '支付失败，请重试' });
  }
});

router.get('/schedule/:studentId', authenticateToken, (req, res) => {
  const studentId = req.params.studentId;

  if (req.user.role === 'parent') {
    const child = db.prepare('SELECT id FROM users WHERE parent_id = ? AND id = ?').get(req.user.id, studentId);
    if (!child) {
      return res.status(403).json({ error: '只能查看自己孩子的课表' });
    }
  }

  if (req.user.role === 'student' && studentId != req.user.id) {
    return res.status(403).json({ error: '只能查看自己的课表' });
  }

  const schedule = db.prepare(`
    SELECT c.id, c.name, c.day_of_week, c.start_time, c.end_time,
           u.name as teacher_name, cl.name as classroom_name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.teacher_id = u.id
    JOIN classrooms cl ON c.classroom_id = cl.id
    WHERE e.student_id = ? AND e.status = 'enrolled' AND c.status = 'published'
    ORDER BY c.day_of_week, c.start_time
  `).all(studentId);

  res.json(schedule);
});

module.exports = router;
