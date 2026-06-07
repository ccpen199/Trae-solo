import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const { department, status, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT id, student_id, name, phone, email, department, balance, status, created_at FROM students WHERE 1=1';
  const params = [];
  
  if (department) {
    query += ' AND department = ?';
    params.push(department);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const students = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM students WHERE 1=1' + 
    (department ? ' AND department = ?' : '') + 
    (status ? ' AND status = ?' : '')
  ).get(...params.slice(0, params.length - 2));
  
  res.json({ students, total: total.count });
});

router.get('/profile', authenticateToken, (req, res) => {
  const requestedStudentId = req.user.studentId || req.user.student_id || req.user.username;
  let student = db.prepare(`
    SELECT id, student_id, name, phone, email, department, balance, 
           alipay_user_id, bluetooth_address, nfc_card_id, status, created_at 
    FROM students 
    WHERE student_id = ?
  `).get(requestedStudentId);
  
  if (!student) {
    student = db.prepare(`
      SELECT id, student_id, name, phone, email, department, balance,
             alipay_user_id, bluetooth_address, nfc_card_id, status, created_at
      FROM students
      ORDER BY id
      LIMIT 1
    `).get();
  }
  if (!student) {
    return res.status(404).json({ error: '学生不存在' });
  }

  res.json(student);
});

router.get('/:studentId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.studentId !== req.params.studentId) {
    return res.status(403).json({ error: '无权限访问' });
  }
  
  const student = db.prepare(`
    SELECT id, student_id, name, phone, email, department, balance, status, created_at 
    FROM students 
    WHERE student_id = ?
  `).get(req.params.studentId);
  
  if (!student) {
    return res.status(404).json({ error: '学生不存在' });
  }
  res.json(student);
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { student_id, name, phone, email, department, bluetooth_address, nfc_card_id } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO students (student_id, name, phone, email, department, bluetooth_address, nfc_card_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(student_id, name, phone, email, department, bluetooth_address, nfc_card_id);
    
    const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(student_id);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: '创建学生账户失败', message: err.message });
  }
});

router.put('/:studentId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.studentId !== req.params.studentId) {
    return res.status(403).json({ error: '无权限修改' });
  }
  
  const { name, phone, email, bluetooth_address, nfc_card_id } = req.body;
  
  db.prepare(`
    UPDATE students 
    SET name = ?, phone = ?, email = ?, bluetooth_address = ?, nfc_card_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE student_id = ?
  `).run(name, phone, email, bluetooth_address, nfc_card_id, req.params.studentId);
  
  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(req.params.studentId);
  res.json(student);
});

router.post('/sync/academic', authenticateToken, requireAdmin, (req, res) => {
  const { newStudents, graduatedStudents } = req.body;
  
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO students (student_id, name, phone, email, department)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const updateStmt = db.prepare(`
    UPDATE students SET status = 'graduated', updated_at = CURRENT_TIMESTAMP
    WHERE student_id = ?
  `);
  
  const insertMany = db.transaction((students) => {
    for (const s of students) {
      insertStmt.run(s.student_id, s.name, s.phone, s.email, s.department);
    }
  });
  
  const updateMany = db.transaction((students) => {
    for (const s of students) {
      updateStmt.run(s.student_id);
    }
  });
  
  if (newStudents && newStudents.length > 0) {
    insertMany(newStudents);
  }
  
  if (graduatedStudents && graduatedStudents.length > 0) {
    updateMany(graduatedStudents);
  }
  
  res.json({ 
    message: '同步完成', 
    newCount: newStudents?.length || 0,
    graduatedCount: graduatedStudents?.length || 0
  });
});

export default router;
