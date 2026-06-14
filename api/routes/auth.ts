import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.js';
import type { Student, Company, Admin } from '../../shared/types.js';

const router = Router();

function generateToken(role: string, id: string): string {
  return `${role}:${id}`;
}

function studentToResponse(student: any): Omit<Student, 'password'> {
  return {
    id: student.id,
    studentId: student.student_id,
    name: student.name,
    school: student.school,
    major: student.major,
    grade: student.grade,
    avatar: student.avatar,
    rating: student.rating,
    verified: !!student.verified,
    phone: student.phone,
    email: student.email,
    resume: {
      skills: JSON.parse(student.resume_skills || '[]'),
      experience: student.resume_experience || '',
      introduction: student.resume_introduction || '',
    },
    createdAt: student.created_at,
  };
}

function companyToResponse(company: any): Omit<Company, 'password'> {
  return {
    id: company.id,
    name: company.name,
    email: company.email,
    licenseNo: company.license_no,
    contactName: company.contact_name,
    contactPhone: company.contact_phone,
    address: company.address,
    avatar: company.avatar,
    verified: !!company.verified,
    description: company.description,
    industry: company.industry,
    createdAt: company.created_at,
  };
}

function adminToResponse(admin: any): Admin {
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
  };
}

router.post('/student/login', (req, res) => {
  const { studentId, password } = req.body;
  const db = getDb();

  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId) as any;

  if (!student) {
    res.status(401).json({ error: '学号或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, student.password);
  if (!valid) {
    res.status(401).json({ error: '学号或密码错误' });
    return;
  }

  const token = generateToken('student', student.id);
  res.json({
    token,
    user: studentToResponse(student),
  });
});

router.post('/student/verify', (req, res) => {
  const { studentId, name, school } = req.body;
  const db = getDb();

  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId) as any;

  if (student && student.name === name && student.school === school) {
    res.json({
      verified: true,
      major: student.major,
      grade: student.grade,
    });
  } else {
    res.json({ verified: false });
  }
});

router.post('/student/register', (req, res) => {
  const { studentId, name, school, password } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM students WHERE student_id = ?').get(studentId);
  if (existing) {
    res.status(400).json({ error: '该学号已注册' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = Math.random().toString(36).substring(2, 15);

  const info = db.prepare(`
    INSERT INTO students (id, student_id, name, school, major, grade, password, verified)
    VALUES (?, ?, ?, ?, '未知专业', '大一', ?, 0)
  `).run(id, studentId, name, school, hashedPassword);

  if (info.changes > 0) {
    const token = generateToken('student', id);
    const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.json({
      token,
      user: studentToResponse(newStudent),
    });
  } else {
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/company/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();

  const company = db.prepare('SELECT * FROM companies WHERE email = ?').get(email) as any;

  if (!company) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, company.password);
  if (!valid) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const token = generateToken('company', company.id);
  res.json({
    token,
    user: companyToResponse(company),
  });
});

router.post('/company/register', (req, res) => {
  const { name, email, password, contactName, contactPhone } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM companies WHERE email = ?').get(email);
  if (existing) {
    res.status(400).json({ error: '该邮箱已注册' });
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = Math.random().toString(36).substring(2, 15);

  const info = db.prepare(`
    INSERT INTO companies (id, name, email, contact_name, contact_phone, password, verified)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, name, email, contactName, contactPhone, hashedPassword);

  if (info.changes > 0) {
    const token = generateToken('company', id);
    const newCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    res.json({
      token,
      user: companyToResponse(newCompany),
    });
  } else {
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;

  if (!admin) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = generateToken('admin', admin.id);
  res.json({
    token,
    user: adminToResponse(admin),
  });
});

export default router;
