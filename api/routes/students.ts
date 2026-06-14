import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Student, Application, Schedule, Wallet, Certificate, WithdrawRecord, Job, Company } from '../../shared/types.js';

const router = Router();

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

function applicationToResponse(app: any): Application {
  return {
    id: app.id,
    studentId: app.student_id,
    jobId: app.job_id,
    status: app.status,
    appliedAt: app.applied_at,
    interviewTime: app.interview_time,
    workHours: app.work_hours,
    salary: app.salary,
    rating: app.rating,
    comment: app.comment,
  };
}

function scheduleToResponse(schedule: any): Schedule {
  return {
    id: schedule.id,
    studentId: schedule.student_id,
    courses: JSON.parse(schedule.courses || '[]'),
  };
}

function walletToResponse(wallet: any): Wallet {
  return {
    id: wallet.id,
    studentId: wallet.student_id,
    balance: wallet.balance,
    alipayAccount: wallet.alipay_account,
    alipayRealName: wallet.alipay_real_name,
    wechatAccount: wallet.wechat_account,
    wechatRealName: wallet.wechat_real_name,
  };
}

function withdrawRecordToResponse(record: any): WithdrawRecord {
  return {
    id: record.id,
    studentId: record.student_id,
    amount: record.amount,
    channel: record.channel,
    status: record.status,
    createdAt: record.created_at,
    completedAt: record.completed_at,
  };
}

function certificateToResponse(cert: any): Certificate {
  return {
    id: cert.id,
    studentId: cert.student_id,
    applicationId: cert.application_id,
    jobTitle: cert.job_title,
    companyName: cert.company_name,
    startDate: cert.start_date,
    endDate: cert.end_date,
    workHours: cert.work_hours,
    salary: cert.salary,
    rating: cert.rating,
    certificateUrl: cert.certificate_url,
    sealUrl: cert.seal_url,
    createdAt: cert.created_at,
  };
}

router.get('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;

  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  res.json(studentToResponse(student));
});

router.put('/:id/profile', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const { name, phone, email, resume, avatar } = req.body;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  const updateFields: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    params.push(name);
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?');
    params.push(phone);
  }
  if (email !== undefined) {
    updateFields.push('email = ?');
    params.push(email);
  }
  if (avatar !== undefined) {
    updateFields.push('avatar = ?');
    params.push(avatar);
  }
  if (resume) {
    if (resume.skills !== undefined) {
      updateFields.push('resume_skills = ?');
      params.push(JSON.stringify(resume.skills));
    }
    if (resume.experience !== undefined) {
      updateFields.push('resume_experience = ?');
      params.push(resume.experience);
    }
    if (resume.introduction !== undefined) {
      updateFields.push('resume_introduction = ?');
      params.push(resume.introduction);
    }
  }

  if (updateFields.length === 0) {
    res.status(400).json({ error: '没有可更新的字段' });
    return;
  }

  params.push(id);

  const result = db.prepare(`UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);

  if (result.changes > 0) {
    const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.json(studentToResponse(updatedStudent));
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

router.get('/:id/schedule', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  let schedule = db.prepare('SELECT * FROM schedules WHERE student_id = ?').get(id) as any;

  if (!schedule) {
    const scheduleId = Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO schedules (id, student_id, courses) VALUES (?, ?, ?)').run(scheduleId, id, '[]');
    schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  }

  res.json(scheduleToResponse(schedule));
});

router.put('/:id/schedule', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  const { courses } = req.body;

  let schedule = db.prepare('SELECT * FROM schedules WHERE student_id = ?').get(id) as any;

  if (!schedule) {
    const scheduleId = Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO schedules (id, student_id, courses) VALUES (?, ?, ?)').run(scheduleId, id, JSON.stringify(courses || []));
    schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  } else {
    db.prepare('UPDATE schedules SET courses = ? WHERE student_id = ?').run(JSON.stringify(courses || []), id);
    schedule = db.prepare('SELECT * FROM schedules WHERE student_id = ?').get(id);
  }

  res.json(scheduleToResponse(schedule));
});

router.get('/:id/applications', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  const applications = db.prepare(`
    SELECT a.*, j.*, c.name as company_name, c.avatar as company_avatar
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE a.student_id = ?
    ORDER BY a.applied_at DESC
  `).all(id) as any[];

  const result = applications.map(app => {
    const application = applicationToResponse(app);
    const job = jobToResponse(app);
    const company = {
      id: app.company_id,
      name: app.company_name,
      avatar: app.company_avatar,
    };
    return {
      ...application,
      job,
      company,
    };
  });

  res.json({
    list: result,
    total: result.length,
  });
});

router.post('/:id/applications', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const { jobId } = req.body;

  if (!jobId) {
    res.status(400).json({ error: '缺少岗位ID' });
    return;
  }

  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  const job = db.prepare('SELECT id, status FROM jobs WHERE id = ?').get(jobId) as any;
  if (!job) {
    res.status(404).json({ error: '岗位不存在' });
    return;
  }

  if (job.status !== 'published') {
    res.status(400).json({ error: '岗位不可投递' });
    return;
  }

  const existingApp = db.prepare(
    'SELECT id FROM applications WHERE student_id = ? AND job_id = ?'
  ).get(id, jobId);

  if (existingApp) {
    res.status(400).json({ error: '已经投递过该岗位' });
    return;
  }

  const applicationId = Math.random().toString(36).substring(2, 15);

  const result = db.prepare(`
    INSERT INTO applications (id, student_id, job_id, status)
    VALUES (?, ?, ?, 'pending')
  `).run(applicationId, id, jobId);

  if (result.changes > 0) {
    const newApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
    res.json(applicationToResponse(newApp));
  } else {
    res.status(500).json({ error: '投递失败' });
  }
});

router.get('/:id/wallet', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  let wallet = db.prepare('SELECT * FROM wallets WHERE student_id = ?').get(id) as any;

  if (!wallet) {
    const walletId = Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO wallets (id, student_id, balance) VALUES (?, ?, 0)').run(walletId, id);
    wallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(walletId);
  }

  res.json(walletToResponse(wallet));
});

router.post('/:id/withdraw', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const { amount, channel } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: '提现金额无效' });
    return;
  }

  if (!channel || !['alipay', 'wechat'].includes(channel)) {
    res.status(400).json({ error: '提现渠道无效' });
    return;
  }

  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  const wallet = db.prepare('SELECT * FROM wallets WHERE student_id = ?').get(id) as any;
  if (!wallet || wallet.balance < amount) {
    res.status(400).json({ error: '余额不足' });
    return;
  }

  const withdrawId = Math.random().toString(36).substring(2, 15);

  const insertResult = db.prepare(`
    INSERT INTO withdraw_records (id, student_id, amount, channel, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(withdrawId, id, amount, channel);

  if (insertResult.changes > 0) {
    db.prepare('UPDATE wallets SET balance = balance - ? WHERE student_id = ?').run(amount, id);
    const newRecord = db.prepare('SELECT * FROM withdraw_records WHERE id = ?').get(withdrawId);
    res.json(withdrawRecordToResponse(newRecord));
  } else {
    res.status(500).json({ error: '提现申请失败' });
  }
});

router.get('/:id/certificates', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  const certificates = db.prepare(`
    SELECT * FROM certificates
    WHERE student_id = ?
    ORDER BY created_at DESC
  `).all(id) as any[];

  res.json({
    list: certificates.map(cert => certificateToResponse(cert)),
    total: certificates.length,
  });
});

router.post('/:id/certificates', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'student' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const { applicationId } = req.body;

  if (!applicationId) {
    res.status(400).json({ error: '缺少申请ID' });
    return;
  }

  const application = db.prepare(`
    SELECT a.*, j.title as job_title, c.name as company_name
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE a.id = ? AND a.student_id = ?
  `).get(applicationId, id) as any;

  if (!application) {
    res.status(404).json({ error: '申请记录不存在' });
    return;
  }

  if (application.status !== 'completed') {
    res.status(400).json({ error: '实习未完成，无法生成证明' });
    return;
  }

  const existingCert = db.prepare(
    'SELECT id FROM certificates WHERE application_id = ?'
  ).get(applicationId);

  if (existingCert) {
    res.status(400).json({ error: '该实习已生成过证明' });
    return;
  }

  const certificateId = Math.random().toString(36).substring(2, 15);
  const certificateUrl = `/certificates/${certificateId}.pdf`;
  const sealUrl = `/seals/${certificateId}.png`;

  const result = db.prepare(`
    INSERT INTO certificates 
    (id, student_id, application_id, job_title, company_name, work_hours, salary, rating, certificate_url, seal_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    certificateId,
    id,
    applicationId,
    application.job_title,
    application.company_name,
    application.work_hours,
    application.salary,
    application.rating || 5,
    certificateUrl,
    sealUrl
  );

  if (result.changes > 0) {
    const newCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certificateId);
    res.json(certificateToResponse(newCert));
  } else {
    res.status(500).json({ error: '生成证明失败' });
  }
});

export default router;
