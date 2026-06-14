import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Message, Conversation, Student, Company, Job } from '../../shared/types.js';

const router = Router();

function messageToResponse(msg: any): Message {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    senderType: msg.sender_type,
    content: msg.content,
    type: msg.type,
    createdAt: msg.created_at,
    read: !!msg.read,
  };
}

function studentToResponse(student: any): Student {
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

function companyToResponse(company: any): Company {
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

function jobToResponse(job: any): Job {
  return {
    id: job.id,
    companyId: job.company_id,
    title: job.title,
    description: job.description,
    location: job.location,
    salaryPerHour: job.salary_per_hour,
    maxHoursPerDay: job.max_hours_per_day,
    maxHoursPerWeek: job.max_hours_per_week,
    majorRequired: JSON.parse(job.major_required || '[]'),
    workDays: JSON.parse(job.work_days || '[]'),
    workStartTime: job.work_start_time,
    workEndTime: job.work_end_time,
    status: job.status,
    createdAt: job.created_at,
  };
}

router.get('/conversations', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.userId!;
  const userRole = req.userRole!;

  let conversations: any[];
  
  if (userRole === 'student') {
    conversations = db.prepare(`
      SELECT c.*, s.name as student_name, s.avatar as student_avatar,
             comp.name as company_name, comp.avatar as company_avatar,
             j.title as job_title
      FROM conversations c
      LEFT JOIN students s ON c.student_id = s.id
      LEFT JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN jobs j ON c.job_id = j.id
      WHERE c.student_id = ?
      ORDER BY c.last_message_at DESC
    `).all(userId) as any[];
  } else if (userRole === 'company') {
    conversations = db.prepare(`
      SELECT c.*, s.name as student_name, s.avatar as student_avatar,
             comp.name as company_name, comp.avatar as company_avatar,
             j.title as job_title
      FROM conversations c
      LEFT JOIN students s ON c.student_id = s.id
      LEFT JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN jobs j ON c.job_id = j.id
      WHERE c.company_id = ?
      ORDER BY c.last_message_at DESC
    `).all(userId) as any[];
  } else {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const result = conversations.map(conv => ({
    id: conv.id,
    studentId: conv.student_id,
    companyId: conv.company_id,
    jobId: conv.job_id,
    lastMessage: conv.last_message,
    lastMessageAt: conv.last_message_at,
    unreadCount: userRole === 'student' ? conv.unread_count_student : conv.unread_count_company,
    student: {
      id: conv.student_id,
      name: conv.student_name,
      avatar: conv.student_avatar,
    },
    company: {
      id: conv.company_id,
      name: conv.company_name,
      avatar: conv.company_avatar,
    },
    job: {
      id: conv.job_id,
      title: conv.job_title,
    },
  })) as Conversation[];

  res.json(result);
});

router.get('/conversations/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;
  const userId = req.userId!;
  const userRole = req.userRole!;

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
  if (!conversation) {
    res.status(404).json({ error: '会话不存在' });
    return;
  }

  if (userRole === 'student' && conversation.student_id !== userId) {
    res.status(403).json({ error: '无权访问此会话' });
    return;
  }
  if (userRole === 'company' && conversation.company_id !== userId) {
    res.status(403).json({ error: '无权访问此会话' });
    return;
  }

  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE conversation_id = ? 
    ORDER BY created_at ASC
  `).all(id) as any[];

  if (userRole === 'student') {
    db.prepare('UPDATE conversations SET unread_count_student = 0 WHERE id = ?').run(id);
  } else if (userRole === 'company') {
    db.prepare('UPDATE conversations SET unread_count_company = 0 WHERE id = ?').run(id);
  }

  const result = messages.map(m => messageToResponse(m));
  res.json(result);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { conversationId, content, type } = req.body;
  const senderId = req.userId!;
  const senderType = req.userRole!;

  if (!conversationId || !content) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId) as any;
  if (!conversation) {
    res.status(404).json({ error: '会话不存在' });
    return;
  }

  if (senderType === 'student' && conversation.student_id !== senderId) {
    res.status(403).json({ error: '无权在此会话中发送消息' });
    return;
  }
  if (senderType === 'company' && conversation.company_id !== senderId) {
    res.status(403).json({ error: '无权在此会话中发送消息' });
    return;
  }

  const messageId = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, type, created_at, read)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(messageId, conversationId, senderId, senderType, content, type || 'text', now);

  if (senderType === 'student') {
    db.prepare(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = ?, unread_count_company = unread_count_company + 1
      WHERE id = ?
    `).run(content, now, conversationId);
  } else if (senderType === 'company') {
    db.prepare(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = ?, unread_count_student = unread_count_student + 1
      WHERE id = ?
    `).run(content, now, conversationId);
  }

  const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
  res.json(messageToResponse(newMessage));
});

router.post('/conversations/init', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { studentId, companyId, jobId } = req.body;
  const userRole = req.userRole!;

  if (!studentId || !companyId || !jobId) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  if (userRole === 'student' && req.userId !== studentId) {
    res.status(403).json({ error: '无权为其他学生创建会话' });
    return;
  }
  if (userRole === 'company' && req.userId !== companyId) {
    res.status(403).json({ error: '无权为其他企业创建会话' });
    return;
  }

  const existing = db.prepare(`
    SELECT * FROM conversations 
    WHERE student_id = ? AND company_id = ? AND job_id = ?
  `).get(studentId, companyId, jobId) as any;

  if (existing) {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) as any;
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;

    res.json({
      id: existing.id,
      studentId: existing.student_id,
      companyId: existing.company_id,
      jobId: existing.job_id,
      lastMessage: existing.last_message,
      lastMessageAt: existing.last_message_at,
      unreadCount: userRole === 'student' ? existing.unread_count_student : existing.unread_count_company,
      student: student ? studentToResponse(student) : undefined,
      company: company ? companyToResponse(company) : undefined,
      job: job ? jobToResponse(job) : undefined,
    } as Conversation);
    return;
  }

  const conversationId = Math.random().toString(36).substring(2, 15);

  db.prepare(`
    INSERT INTO conversations (id, student_id, company_id, job_id, unread_count_student, unread_count_company)
    VALUES (?, ?, ?, ?, 0, 0)
  `).run(conversationId, studentId, companyId, jobId);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) as any;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;

  res.json({
    id: conversationId,
    studentId,
    companyId,
    jobId,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    student: student ? studentToResponse(student) : undefined,
    company: company ? companyToResponse(company) : undefined,
    job: job ? jobToResponse(job) : undefined,
  } as Conversation);
});

export default router;
