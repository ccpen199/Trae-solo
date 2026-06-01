const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/classes', (req, res) => {
  const user = req.user;
  let classes = [];

  if (user.role === 'admin') {
    classes = db.prepare(`
      SELECT c.*, g.name as grade_name, g.level as grade_level, u.name as head_teacher_name
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      LEFT JOIN users u ON c.head_teacher_id = u.id
      WHERE g.school_id = ?
    `).all(user.school_id);
  } else if (user.role === 'teacher') {
    classes = db.prepare(`
      SELECT DISTINCT c.*, g.name as grade_name, g.level as grade_level, u.name as head_teacher_name
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users u ON c.head_teacher_id = u.id
      WHERE ct.teacher_id = ?
    `).all(user.id);
  } else if (user.role === 'guardian') {
    classes = db.prepare(`
      SELECT DISTINCT c.*, g.name as grade_name, g.level as grade_level, u.name as head_teacher_name
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      JOIN students s ON c.id = s.class_id
      JOIN guardians gu ON s.id = gu.student_id
      LEFT JOIN users u ON c.head_teacher_id = u.id
      WHERE gu.user_id = ?
    `).all(user.id);
  }

  res.json(classes);
});

router.get('/classes/:classId/students', requireRoles('admin', 'teacher'), (req, res) => {
  const { classId } = req.params;
  
  const students = db.prepare(`
    SELECT s.*, c.name as class_name, g.name as grade_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    JOIN grades g ON c.grade_id = g.id
    WHERE s.class_id = ?
    ORDER BY s.name
  `).all(classId);

  for (const student of students) {
    student.guardians = db.prepare(`
      SELECT u.id, u.name, u.phone, g.relation, g.is_primary
      FROM guardians g
      JOIN users u ON g.user_id = u.id
      WHERE g.student_id = ?
    `).all(student.id);
  }

  res.json(students);
});

router.get('/students/:studentId', (req, res) => {
  const { studentId } = req.params;
  const user = req.user;

  let student;
  if (user.role === 'admin' || user.role === 'teacher') {
    student = db.prepare(`
      SELECT s.*, c.name as class_name, g.name as grade_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE s.id = ?
    `).get(studentId);
  } else if (user.role === 'guardian') {
    student = db.prepare(`
      SELECT s.*, c.name as class_name, g.name as grade_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN guardians gu ON s.id = gu.student_id
      WHERE s.id = ? AND gu.user_id = ?
    `).get(studentId, user.id);
  }

  if (!student) {
    return res.status(404).json({ error: '学生不存在或无权限查看' });
  }

  student.guardians = db.prepare(`
    SELECT u.id, u.name, u.phone, u.email, g.relation, g.is_primary
    FROM guardians g
    JOIN users u ON g.user_id = u.id
    WHERE g.student_id = ?
  `).all(studentId);

  res.json(student);
});

router.post('/students', requireRoles('admin'), (req, res) => {
  const { class_id, name, student_no, gender, birth_date } = req.body;

  if (!name) {
    return res.status(400).json({ error: '学生姓名不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO students (class_id, name, student_no, gender, birth_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(class_id || null, name, student_no || null, gender || null, birth_date || null);

  res.json({ id: result.lastInsertRowid, message: '学生添加成功' });
});

router.put('/students/:studentId', requireRoles('admin'), (req, res) => {
  const { studentId } = req.params;
  const { class_id, name, student_no, gender, birth_date, status } = req.body;

  db.prepare(`
    UPDATE students 
    SET class_id = ?, name = ?, student_no = ?, gender = ?, birth_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(class_id || null, name, student_no || null, gender || null, birth_date || null, status || 'active', studentId);

  res.json({ message: '学生信息更新成功' });
});

router.post('/guardians', requireRoles('admin'), (req, res) => {
  const { student_id, name, phone, email, relation, is_primary, username, password } = req.body;

  if (!student_id || !name || !relation) {
    return res.status(400).json({ error: '必要信息不能为空' });
  }

  const tx = db.transaction(() => {
    let userId;
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const hashedPassword = bcrypt.hashSync(password || '123456', 10);
      const result = db.prepare(`
        INSERT INTO users (username, password, name, phone, email, role, school_id)
        VALUES (?, ?, ?, ?, ?, 'guardian', (SELECT school_id FROM classes c JOIN grades g ON c.grade_id = g.id WHERE c.id = (SELECT class_id FROM students WHERE id = ?)))
      `).run(username || phone, hashedPassword, name, phone, email || null, student_id);
      userId = result.lastInsertRowid;
    }

    db.prepare(`
      INSERT OR REPLACE INTO guardians (user_id, student_id, relation, is_primary)
      VALUES (?, ?, ?, ?)
    `).run(userId, student_id, relation, is_primary ? 1 : 0);

    return { userId };
  });

  try {
    const result = tx();
    res.json({ ...result, message: '监护人添加成功' });
  } catch (error) {
    res.status(500).json({ error: '添加失败: ' + error.message });
  }
});

router.get('/teachers', requireRoles('admin', 'teacher'), (req, res) => {
  const user = req.user;
  let teachers;

  if (user.role === 'admin') {
    teachers = db.prepare(`
      SELECT u.*, 
        GROUP_CONCAT(DISTINCT c.name) as classes,
        CASE WHEN EXISTS (SELECT 1 FROM classes WHERE head_teacher_id = u.id) THEN 1 ELSE 0 END as is_head_teacher
      FROM users u
      LEFT JOIN class_teachers ct ON u.id = ct.teacher_id
      LEFT JOIN classes c ON ct.class_id = c.id
      WHERE u.role = 'teacher' AND u.school_id = ?
      GROUP BY u.id
    `).all(user.school_id);
  } else {
    teachers = db.prepare(`
      SELECT DISTINCT u.*, ct.subject, c.name as class_name
      FROM users u
      JOIN class_teachers ct ON u.id = ct.teacher_id
      JOIN classes c ON ct.class_id = c.id
      WHERE u.role = 'teacher'
      AND c.id IN (SELECT class_id FROM class_teachers WHERE teacher_id = ?)
    `).all(user.id);
  }

  res.json(teachers);
});

module.exports = router;
