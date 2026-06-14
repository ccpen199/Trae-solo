import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Company, Job, Application, Student, PayrollRecord } from '../../shared/types.js';

const router = Router();

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

function payrollRecordToResponse(record: any): PayrollRecord {
  return {
    id: record.id,
    applicationId: record.application_id,
    companyId: record.company_id,
    studentId: record.student_id,
    amount: record.amount,
    status: record.status,
    batchId: record.batch_id,
    paidAt: record.paid_at,
    createdAt: record.created_at,
  };
}

router.get('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as any;

  if (!company) {
    res.status(404).json({ error: '企业不存在' });
    return;
  }

  res.json(companyToResponse(company));
});

router.put('/:id/profile', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'company' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as any;
  if (!company) {
    res.status(404).json({ error: '企业不存在' });
    return;
  }

  const { name, contactName, contactPhone, address, description, industry, avatar } = req.body;

  const updateFields: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    params.push(name);
  }
  if (contactName !== undefined) {
    updateFields.push('contact_name = ?');
    params.push(contactName);
  }
  if (contactPhone !== undefined) {
    updateFields.push('contact_phone = ?');
    params.push(contactPhone);
  }
  if (address !== undefined) {
    updateFields.push('address = ?');
    params.push(address);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    params.push(description);
  }
  if (industry !== undefined) {
    updateFields.push('industry = ?');
    params.push(industry);
  }
  if (avatar !== undefined) {
    updateFields.push('avatar = ?');
    params.push(avatar);
  }

  if (updateFields.length === 0) {
    res.status(400).json({ error: '没有可更新的字段' });
    return;
  }

  params.push(id);

  const result = db.prepare(`UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);

  if (result.changes > 0) {
    const updatedCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    res.json(companyToResponse(updatedCompany));
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/:id/verify', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'company' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as any;
  if (!company) {
    res.status(404).json({ error: '企业不存在' });
    return;
  }

  if (company.verified) {
    res.status(400).json({ error: '企业已认证' });
    return;
  }

  const { licenseNo, contactName, contactPhone, address } = req.body;

  if (!licenseNo) {
    res.status(400).json({ error: '请提供营业执照号' });
    return;
  }

  const updateFields: string[] = [];
  const params: any[] = [];

  updateFields.push('license_no = ?');
  params.push(licenseNo);

  if (contactName !== undefined) {
    updateFields.push('contact_name = ?');
    params.push(contactName);
  }
  if (contactPhone !== undefined) {
    updateFields.push('contact_phone = ?');
    params.push(contactPhone);
  }
  if (address !== undefined) {
    updateFields.push('address = ?');
    params.push(address);
  }

  params.push(id);

  const result = db.prepare(`UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);

  if (result.changes > 0) {
    const updatedCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    res.json({
      success: true,
      message: '认证申请已提交',
      company: companyToResponse(updatedCompany),
    });
  } else {
    res.status(500).json({ error: '提交认证失败' });
  }
});

router.get('/:id/jobs', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const company = db.prepare('SELECT id FROM companies WHERE id = ?').get(id);
  if (!company) {
    res.status(404).json({ error: '企业不存在' });
    return;
  }

  const status = req.query.status as string;

  let whereSql = 'company_id = ?';
  const params: any[] = [id];

  if (status) {
    whereSql += ' AND status = ?';
    params.push(status);
  }

  const jobs = db.prepare(`
    SELECT * FROM jobs
    WHERE ${whereSql}
    ORDER BY created_at DESC
  `).all(...params) as any[];

  const result = jobs.map(job => {
    const jobData = jobToResponse(job);
    const appCount = db.prepare(
      'SELECT COUNT(*) as count FROM applications WHERE job_id = ?'
    ).get(job.id) as { count: number };
    return {
      ...jobData,
      applicationCount: appCount.count,
    };
  });

  res.json({
    list: result,
    total: result.length,
  });
});

router.get('/:id/candidates', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'company' || req.userId !== id) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const company = db.prepare('SELECT id FROM companies WHERE id = ?').get(id);
  if (!company) {
    res.status(404).json({ error: '企业不存在' });
    return;
  }

  const jobId = req.query.jobId as string;
  const status = req.query.status as string;

  let whereClauses: string[] = ['j.company_id = ?'];
  let params: any[] = [id];

  if (jobId) {
    whereClauses.push('a.job_id = ?');
    params.push(jobId);
  }

  if (status) {
    whereClauses.push('a.status = ?');
    params.push(status);
  }

  const whereSql = whereClauses.join(' AND ');

  const applications = db.prepare(`
    SELECT a.*, s.*, j.title as job_title
    FROM applications a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN jobs j ON a.job_id = j.id
    WHERE ${whereSql}
    ORDER BY a.applied_at DESC
  `).all(...params) as any[];

  const result = applications.map(app => {
    const application = applicationToResponse(app);
    const student = studentToResponse(app);
    return {
      ...application,
      student,
      jobTitle: app.job_title,
    };
  });

  res.json({
    list: result,
    total: result.length,
  });
});

router.put('/applications/:id/status', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;

  if (req.userRole !== 'company') {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const { status, interviewTime } = req.body;

  if (!status || !['accepted', 'rejected', 'interview'].includes(status)) {
    res.status(400).json({ error: '状态无效' });
    return;
  }

  const application = db.prepare(`
    SELECT a.*, j.company_id
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    WHERE a.id = ?
  `).get(id) as any;

  if (!application) {
    res.status(404).json({ error: '申请不存在' });
    return;
  }

  if (application.company_id !== req.userId) {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  let updateFields = ['status = ?'];
  let params: any[] = [status];

  if (status === 'interview' && interviewTime) {
    updateFields.push('interview_time = ?');
    params.push(interviewTime);
  }

  params.push(id);

  const result = db.prepare(`UPDATE applications SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);

  if (result.changes > 0) {
    const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.json(applicationToResponse(updatedApp));
  } else {
    res.status(500).json({ error: '更新状态失败' });
  }
});

router.post('/payroll/batch', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();

  if (req.userRole !== 'company') {
    res.status(403).json({ error: '权限不足' });
    return;
  }

  const companyId = req.userId;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: '代发列表无效' });
    return;
  }

  const batchId = Math.random().toString(36).substring(2, 15);
  const payrollRecords: PayrollRecord[] = [];

  const stmt = db.prepare(`
    INSERT INTO payroll_records 
    (id, application_id, company_id, student_id, amount, status, batch_id)
    VALUES (?, ?, ?, ?, ?, 'processing', ?)
  `);

  const updateWalletStmt = db.prepare(`
    UPDATE wallets SET balance = balance + ? WHERE student_id = ?
  `);

  const insertWalletStmt = db.prepare(`
    INSERT INTO wallets (id, student_id, balance) VALUES (?, ?, ?)
  `);

  const transaction = db.transaction((items: any[]) => {
    for (const item of items) {
      const { applicationId, studentId, amount } = item;

      if (!applicationId || !studentId || !amount || amount <= 0) {
        continue;
      }

      const application = db.prepare(`
        SELECT id, status FROM applications 
        WHERE id = ? AND student_id = ? AND job_id IN (SELECT id FROM jobs WHERE company_id = ?)
      `).get(applicationId, studentId, companyId) as any;

      if (!application) {
        continue;
      }

      const recordId = Math.random().toString(36).substring(2, 15);

      stmt.run(recordId, applicationId, companyId, studentId, amount, batchId);

      const wallet = db.prepare('SELECT id FROM wallets WHERE student_id = ?').get(studentId);
      if (wallet) {
        updateWalletStmt.run(amount, studentId);
      } else {
        const walletId = Math.random().toString(36).substring(2, 15);
        insertWalletStmt.run(walletId, studentId, amount);
      }

      const record = db.prepare('SELECT * FROM payroll_records WHERE id = ?').get(recordId);
      payrollRecords.push(payrollRecordToResponse(record));
    }

    return payrollRecords;
  });

  try {
    const result = transaction(items);

    db.prepare(`
      UPDATE payroll_records SET status = 'paid', paid_at = datetime('now')
      WHERE batch_id = ?
    `).run(batchId);

    const updatedRecords = db.prepare(
      'SELECT * FROM payroll_records WHERE batch_id = ?'
    ).all(batchId) as any[];

    res.json({
      batchId,
      total: updatedRecords.length,
      records: updatedRecords.map(r => payrollRecordToResponse(r)),
    });
  } catch (error) {
    res.status(500).json({ error: '批量代发失败' });
  }
});

export default router;
