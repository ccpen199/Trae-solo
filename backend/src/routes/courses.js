const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, grade_id, teacher_id } = req.query;
  let query = `
    SELECT c.*, 
           u.name as teacher_name,
           cl.name as classroom_name,
           cl.capacity as classroom_capacity
    FROM courses c
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN classrooms cl ON c.classroom_id = cl.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }

  if (grade_id) {
    query += ' AND json_contains(c.grade_ids, ?)';
    params.push(grade_id);
  }

  if (teacher_id) {
    query += ' AND c.teacher_id = ?';
    params.push(teacher_id);
  }

  query += ' ORDER BY c.created_at DESC';

  const courses = db.prepare(query).all(...params);
  
  courses.forEach(course => {
    course.grade_ids = JSON.parse(course.grade_ids);
  });

  res.json(courses);
});

router.get('/:id', authenticateToken, (req, res) => {
  const course = db.prepare(`
    SELECT c.*, 
           u.name as teacher_name,
           cl.name as classroom_name
    FROM courses c
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN classrooms cl ON c.classroom_id = cl.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  course.grade_ids = JSON.parse(course.grade_ids);
  res.json(course);
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  const {
    name, description, teacher_id, classroom_id, grade_ids,
    day_of_week, start_time, end_time, capacity, fee,
    enrollment_start, enrollment_end, refund_deadline, refund_rule, requirements
  } = req.body;

  const result = db.prepare(`
    INSERT INTO courses (
      name, description, teacher_id, classroom_id, grade_ids,
      day_of_week, start_time, end_time, capacity, fee,
      enrollment_start, enrollment_end, refund_deadline, refund_rule, requirements,
      status, enrolled_count, waitlist_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, 0)
  `).run(
    name, description, teacher_id, classroom_id, JSON.stringify(grade_ids),
    day_of_week, start_time, end_time, capacity, fee,
    enrollment_start, enrollment_end, refund_deadline, refund_rule, requirements
  );

  res.json({ id: result.lastInsertRowid, message: '课程创建成功' });
});

router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const courseId = req.params.id;
  const oldCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);

  if (!oldCourse) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const {
    name, description, teacher_id, classroom_id, grade_ids,
    day_of_week, start_time, end_time, capacity, fee, status,
    enrollment_start, enrollment_end, refund_deadline, refund_rule, requirements
  } = req.body;

  const oldValues = {};
  const newValues = {};
  const fieldsToUpdate = [];
  const params = [];

  const updateFields = {
    name, description, teacher_id, classroom_id,
    day_of_week, start_time, end_time, capacity, fee, status,
    enrollment_start, enrollment_end, refund_deadline, refund_rule, requirements
  };

  Object.entries(updateFields).forEach(([key, value]) => {
    if (value !== undefined) {
      oldValues[key] = oldCourse[key];
      newValues[key] = value;
      fieldsToUpdate.push(`${key} = ?`);
      params.push(key === 'grade_ids' ? JSON.stringify(value) : value);
    }
  });

  if (grade_ids !== undefined) {
    oldValues.grade_ids = oldCourse.grade_ids;
    newValues.grade_ids = JSON.stringify(grade_ids);
    fieldsToUpdate.push('grade_ids = ?');
    params.push(JSON.stringify(grade_ids));
  }

  fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
  params.push(courseId);

  db.prepare(`UPDATE courses SET ${fieldsToUpdate.join(', ')} WHERE id = ?`).run(...params);

  const changedKeys = Object.keys(newValues).filter(k => oldValues[k] !== newValues[k]);
  if (changedKeys.length > 0 && oldCourse.status === 'published') {
    const changeLog = db.prepare(`
      INSERT INTO course_changes (course_id, changed_by, change_type, old_values, new_values)
      VALUES (?, ?, 'update', ?, ?)
    `).run(
      courseId,
      req.user.id,
      JSON.stringify(Object.fromEntries(changedKeys.map(k => [k, oldValues[k]]))),
      JSON.stringify(Object.fromEntries(changedKeys.map(k => [k, newValues[k]])))
    );

    const enrolledStudents = db.prepare(`
      SELECT student_id FROM enrollments WHERE course_id = ? AND status = 'enrolled'
    `).all(courseId);

    const insertNotification = db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    enrolledStudents.forEach(({ student_id }) => {
      const student = db.prepare('SELECT parent_id FROM users WHERE id = ?').get(student_id);
      if (student && student.parent_id) {
        insertNotification.run(
          student.parent_id,
          'course_change',
          `课程《${oldCourse.name}》已更新`,
          `课程信息有变更: ${changedKeys.join(', ')}`,
          courseId,
          'course'
        );
      }
    });
  }

  res.json({ message: '课程更新成功' });
});

router.post('/:id/publish', authenticateToken, requireRole('admin'), (req, res) => {
  const courseId = req.params.id;
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);

  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  db.prepare("UPDATE courses SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(courseId);
  res.json({ message: '课程发布成功' });
});

router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const courseId = req.params.id;
  const hasEnrollments = db.prepare('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?').get(courseId);

  if (hasEnrollments.count > 0) {
    return res.status(400).json({ error: '课程已有学生报名，无法删除' });
  }

  db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);
  res.json({ message: '课程删除成功' });
});

module.exports = router;
