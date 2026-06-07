import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (admin && admin.password === password) {
    const token = jwt.sign(
      { userId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'campus-hotwater-saas-secret-key-2024',
      { expiresIn: '24h' }
    );
    return res.json({ token, user: { id: admin.id, username: admin.username, role: admin.role } });
  }
  
  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(username);
  if (student) {
    if (password && student.password && student.password !== password) {
      return res.status(401).json({ error: '密码错误' });
    }
    const token = jwt.sign(
      { userId: student.id, studentId: student.student_id, name: student.name, role: 'student' },
      process.env.JWT_SECRET || 'campus-hotwater-saas-secret-key-2024',
      { expiresIn: '24h' }
    );
    return res.json({ token, user: { id: student.id, studentId: student.student_id, name: student.name, role: 'student', balance: student.balance, phone: student.phone, department: student.department } });
  }
  
  res.status(401).json({ error: '用户名或密码错误' });
});

router.post('/device/auth', (req, res) => {
  const { device_id, bluetooth_address, nfc_id, phone } = req.body;
  
  let student = null;
  
  if (bluetooth_address) {
    student = db.prepare('SELECT * FROM students WHERE bluetooth_address = ?').get(bluetooth_address);
  }
  if (!student && nfc_id) {
    student = db.prepare('SELECT * FROM students WHERE nfc_card_id = ?').get(nfc_id);
  }
  
  if (!student) {
    return res.status(404).json({ error: '未找到匹配的学生账户', needPhoneVerify: true });
  }
  
  if (phone && student.phone !== phone) {
    return res.status(400).json({ error: '手机号不匹配', needPhoneVerify: true });
  }
  
  if (student.balance < 5) {
    return res.status(402).json({ error: '余额不足，请先充值', balance: student.balance, needRecharge: true });
  }
  
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const authToken = jwt.sign(
    { studentId: student.student_id, deviceId: device_id },
    process.env.JWT_SECRET || 'campus-hotwater-saas-secret-key-2024',
    { expiresIn: '5m' }
  );
  
  db.prepare(`
    INSERT INTO auth_sessions (student_id, device_id, auth_method, auth_token, phone_verified, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    student.student_id, 
    device_id, 
    bluetooth_address ? 'bluetooth' : 'nfc', 
    authToken,
    phone ? 1 : 0,
    expiresAt
  );
  
  res.json({
    success: true,
    authToken,
    student: {
      student_id: student.student_id,
      name: student.name,
      balance: student.balance
    },
    expiresAt
  });
});

router.post('/device/verify-phone', (req, res) => {
  const { device_id, phone, verification_code } = req.body;
  
  const student = db.prepare('SELECT * FROM students WHERE phone = ?').get(phone);
  if (!student) {
    return res.status(404).json({ error: '手机号未绑定任何账户' });
  }
  
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const authToken = jwt.sign(
    { studentId: student.student_id, deviceId: device_id },
    process.env.JWT_SECRET || 'campus-hotwater-saas-secret-key-2024',
    { expiresIn: '5m' }
  );
  
  db.prepare(`
    INSERT INTO auth_sessions (student_id, device_id, auth_method, auth_token, phone_verified, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(student.student_id, device_id, 'phone', authToken, 1, expiresAt);
  
  res.json({
    success: true,
    authToken,
    student: {
      student_id: student.student_id,
      name: student.name,
      balance: student.balance
    }
  });
});

export default router;
