const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/init');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/leaves');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.use(authenticate);

router.get('/', (req, res) => {
  const user = req.user;
  let leaves = [];

  if (user.role === 'guardian') {
    leaves = db.prepare(`
      SELECT lr.*, s.name as student_name, s.student_no, c.name as class_name,
        u.name as guardian_name, au.name as approver_name
      FROM leave_requests lr
      JOIN students s ON lr.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN users u ON lr.guardian_id = u.id
      LEFT JOIN users au ON lr.approver_id = au.id
      WHERE lr.guardian_id = ?
      ORDER BY lr.created_at DESC
    `).all(user.id);
  } else if (user.role === 'teacher' || user.role === 'admin') {
    let query = `
      SELECT lr.*, s.name as student_name, s.student_no, c.name as class_name,
        u.name as guardian_name, u.phone as guardian_phone,
        au.name as approver_name
      FROM leave_requests lr
      JOIN students s ON lr.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN users u ON lr.guardian_id = u.id
      LEFT JOIN users au ON lr.approver_id = au.id
    `;
    
    if (user.role === 'teacher') {
      query += ' WHERE c.head_teacher_id = ?';
      leaves = db.prepare(query).all(user.id);
    } else {
      query += ' ORDER BY lr.created_at DESC';
      leaves = db.prepare(query).all();
    }
  }

  for (const leave of leaves) {
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    leave.days = days;
    leave.is_long_leave = days >= 3;
  }

  res.json(leaves);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const user = req.user;

  let leave;
  if (user.role === 'guardian') {
    leave = db.prepare(`
      SELECT lr.*, s.name as student_name, s.student_no, c.name as class_name,
        u.name as guardian_name, au.name as approver_name
      FROM leave_requests lr
      JOIN students s ON lr.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN users u ON lr.guardian_id = u.id
      LEFT JOIN users au ON lr.approver_id = au.id
      WHERE lr.id = ? AND lr.guardian_id = ?
    `).get(id, user.id);
  } else {
    leave = db.prepare(`
      SELECT lr.*, s.name as student_name, s.student_no, c.name as class_name,
        u.name as guardian_name, u.phone as guardian_phone,
        au.name as approver_name
      FROM leave_requests lr
      JOIN students s ON lr.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN users u ON lr.guardian_id = u.id
      LEFT JOIN users au ON lr.approver_id = au.id
      WHERE lr.id = ?
    `).get(id);
  }

  if (!leave) {
    return res.status(404).json({ error: '请假记录不存在' });
  }

  const start = new Date(leave.start_date);
  const end = new Date(leave.end_date);
  leave.days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  leave.is_long_leave = leave.days >= 3;

  res.json(leave);
});

router.post('/', requireRoles('guardian'), upload.single('proof'), (req, res) => {
  const { student_id, leave_type, start_date, end_date, reason } = req.body;
  const user = req.user;

  if (!student_id || !leave_type || !start_date || !end_date || !reason) {
    return res.status(400).json({ error: '请填写完整的请假信息' });
  }

  const isMyChild = db.prepare(`
    SELECT 1 FROM guardians WHERE user_id = ? AND student_id = ?
  `).get(user.id, student_id);

  if (!isMyChild) {
    return res.status(403).json({ error: '只能为自己的孩子请假' });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const result = db.prepare(`
    INSERT INTO leave_requests (student_id, guardian_id, leave_type, start_date, end_date, reason, proof_file)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(student_id, user.id, leave_type, start_date, end_date, reason, req.file ? req.file.path : null);

  if (days >= 3) {
    const classInfo = db.prepare(`
      SELECT c.head_teacher_id 
      FROM students s 
      JOIN classes c ON s.class_id = c.id 
      WHERE s.id = ?
    `).get(student_id);
    
    if (classInfo && classInfo.head_teacher_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
        VALUES (?, 'leave_alert', ?, ?, 'leave', ?)
      `).run(classInfo.head_teacher_id, '长假提醒', `学生请假${days}天，请及时审批`, result.lastInsertRowid);
    }
  }

  res.json({ id: result.lastInsertRowid, message: '请假申请已提交' });
});

router.post('/:id/approve', requireRoles('teacher', 'admin'), (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;
  const user = req.user;

  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id);
  if (!leave) {
    return res.status(404).json({ error: '请假记录不存在' });
  }

  if (user.role === 'teacher') {
    const isHeadTeacher = db.prepare(`
      SELECT 1 FROM students s 
      JOIN classes c ON s.class_id = c.id 
      WHERE s.id = ? AND c.head_teacher_id = ?
    `).get(leave.student_id, user.id);
    
    if (!isHeadTeacher) {
      return res.status(403).json({ error: '只有班主任可以审批' });
    }
  }

  db.prepare(`
    UPDATE leave_requests 
    SET status = ?, approver_id = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status || 'approved', user.id, id);

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_type, related_id)
    VALUES (?, 'leave_status', ?, ?, 'leave', ?)
  `).run(leave.guardian_id, '请假审批结果', `您的请假申请已${status === 'approved' ? '通过' : '拒绝'}`, id);

  res.json({ message: '审批完成' });
});

router.post('/:id/checkin', requireRoles('teacher', 'admin'), (req, res) => {
  const { id } = req.params;

  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id);
  if (!leave) {
    return res.status(404).json({ error: '请假记录不存在' });
  }

  db.prepare(`
    UPDATE leave_requests 
    SET check_in_at = CURRENT_TIMESTAMP, status = 'completed'
    WHERE id = ?
  `).run(id);

  res.json({ message: '销假完成' });
});

module.exports = router;
