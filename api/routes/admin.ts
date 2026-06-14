import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js';
import type {
  AdminOverview,
  SchoolStats,
  Complaint,
  Student,
  Company,
  Job,
  TrendItem,
  SchoolDistributionItem,
  TypeDistributionItem,
} from '../../shared/types.js';

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

function complaintToResponse(complaint: any): Complaint {
  return {
    id: complaint.id,
    studentId: complaint.student_id,
    companyId: complaint.company_id,
    jobId: complaint.job_id,
    type: complaint.type,
    description: complaint.description,
    status: complaint.status,
    result: complaint.result,
    createdAt: complaint.created_at,
    resolvedAt: complaint.resolved_at,
  };
}

router.get('/overview', authMiddleware, requireRole('admin'), (req: AuthRequest, res) => {
  const db = getDb();

  const totalStudents = (db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number }).count;
  const totalCompanies = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
  const totalJobs = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number }).count;
  const totalApplications = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number }).count;
  const totalComplaints = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as { count: number }).count;

  const complaintRate = totalApplications > 0 ? (totalComplaints / totalApplications) * 100 : 0;

  const avgSalaryResult = db.prepare('SELECT AVG(salary_per_hour) as avg FROM jobs WHERE status = ?').get('published') as { avg: number | null };
  const avgSalary = avgSalaryResult.avg || 0;

  const minWageResult = db.prepare('SELECT MIN(min_wage) as min FROM filing_forms').get() as { min: number | null };
  const minWage = minWageResult.min || 0;
  const compliantJobs = minWage > 0
    ? (db.prepare('SELECT COUNT(*) as count FROM jobs j JOIN filing_forms f ON j.id = f.job_id WHERE j.salary_per_hour >= f.min_wage AND j.status = ?').get('published') as { count: number }).count
    : totalJobs;
  const salaryComplianceRate = totalJobs > 0 ? (compliantJobs / totalJobs) * 100 : 0;

  const dailyTrend: TrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const students = (db.prepare("SELECT COUNT(*) as count FROM students WHERE DATE(created_at) = ?").get(dateStr) as { count: number }).count;
    const jobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE DATE(created_at) = ?").get(dateStr) as { count: number }).count;
    const applications = (db.prepare("SELECT COUNT(*) as count FROM applications WHERE DATE(applied_at) = ?").get(dateStr) as { count: number }).count;

    dailyTrend.push({
      date: dateStr,
      students,
      jobs,
      applications,
    });
  }

  const schoolDistribution: SchoolDistributionItem[] = db.prepare(`
    SELECT school as name, COUNT(*) as value 
    FROM students 
    GROUP BY school 
    ORDER BY value DESC 
    LIMIT 10
  `).all() as SchoolDistributionItem[];

  const jobTypeDistribution: TypeDistributionItem[] = db.prepare(`
    SELECT industry as name, COUNT(*) as value 
    FROM companies c 
    JOIN jobs j ON c.id = j.company_id 
    WHERE j.status = 'published' AND c.industry IS NOT NULL AND c.industry != ''
    GROUP BY c.industry 
    ORDER BY value DESC 
    LIMIT 10
  `).all() as TypeDistributionItem[];

  const overview: AdminOverview = {
    totalStudents,
    totalCompanies,
    totalJobs,
    totalApplications,
    totalComplaints,
    complaintRate,
    salaryComplianceRate,
    avgSalary,
    dailyTrend,
    schoolDistribution,
    jobTypeDistribution,
  };

  res.json(overview);
});

router.get('/schools', authMiddleware, requireRole('admin'), (req: AuthRequest, res) => {
  const db = getDb();

  const page = parseInt(req.query.page as string) || 1;
  const size = parseInt(req.query.size as string) || 10;
  const keyword = req.query.keyword as string || '';
  const offset = (page - 1) * size;

  let whereSql = '';
  let params: any[] = [];

  if (keyword) {
    whereSql = 'WHERE s.name LIKE ?';
    params.push(`%${keyword}%`);
  }

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM schools s ${whereSql}
  `).get(...params) as { total: number };

  const schools = db.prepare(`
    SELECT s.*,
           (SELECT COUNT(*) FROM students st WHERE st.school = s.name) as student_count,
           (SELECT COUNT(*) FROM jobs j JOIN companies c ON j.company_id = c.id WHERE c.name IN (SELECT name FROM companies WHERE 1=0)) as job_count,
           (SELECT COUNT(*) FROM applications a JOIN students st ON a.student_id = st.id WHERE st.school = s.name) as application_count,
           (SELECT COUNT(*) FROM complaints comp JOIN students st ON comp.student_id = st.id WHERE st.school = s.name) as complaint_count
    FROM schools s
    ${whereSql}
    ORDER BY student_count DESC
    LIMIT ? OFFSET ?
  `).all(...params, size, offset) as any[];

  const result: SchoolStats[] = schools.map(s => {
    const applicationCount = s.application_count || 0;
    const complaintCount = s.complaint_count || 0;
    const complaintRate = applicationCount > 0 ? (complaintCount / applicationCount) * 100 : 0;

    const avgSalaryResult = db.prepare(`
      SELECT AVG(j.salary_per_hour) as avg 
      FROM applications a 
      JOIN students st ON a.student_id = st.id 
      JOIN jobs j ON a.job_id = j.id 
      WHERE st.school = ?
    `).get(s.name) as { avg: number | null };

    return {
      id: s.id,
      name: s.name,
      province: s.province,
      studentCount: s.student_count || 0,
      jobCount: s.job_count || 0,
      applicationCount,
      complaintCount,
      complaintRate,
      avgSalary: avgSalaryResult.avg || 0,
    };
  });

  res.json({
    list: result,
    total: countResult.total,
    page,
    size,
  });
});

router.get('/complaints', authMiddleware, requireRole('admin'), (req: AuthRequest, res) => {
  const db = getDb();

  const page = parseInt(req.query.page as string) || 1;
  const size = parseInt(req.query.size as string) || 10;
  const status = req.query.status as string || '';
  const type = req.query.type as string || '';
  const keyword = req.query.keyword as string || '';
  const offset = (page - 1) * size;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (status) {
    whereClauses.push('c.status = ?');
    params.push(status);
  }

  if (type) {
    whereClauses.push('c.type = ?');
    params.push(type);
  }

  if (keyword) {
    whereClauses.push('(c.description LIKE ? OR s.name LIKE ? OR comp.name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM complaints c ${whereSql}
  `).get(...params) as { total: number };

  const complaints = db.prepare(`
    SELECT c.*, 
           s.name as student_name, s.avatar as student_avatar,
           comp.name as company_name, comp.avatar as company_avatar,
           j.title as job_title
    FROM complaints c
    LEFT JOIN students s ON c.student_id = s.id
    LEFT JOIN companies comp ON c.company_id = comp.id
    LEFT JOIN jobs j ON c.job_id = j.id
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, size, offset) as any[];

  const result: Complaint[] = complaints.map(c => ({
    ...complaintToResponse(c),
    student: {
      id: c.student_id,
      name: c.student_name,
      avatar: c.student_avatar,
    } as Student,
    company: {
      id: c.company_id,
      name: c.company_name,
      avatar: c.company_avatar,
    } as Company,
    job: {
      id: c.job_id,
      title: c.job_title,
    } as Job,
  }));

  res.json({
    list: result,
    total: countResult.total,
    page,
    size,
  });
});

router.put('/complaints/:id', authMiddleware, requireRole('admin'), (req: AuthRequest, res) => {
  const db = getDb();
  const { id } = req.params;
  const { status, result: complaintResult } = req.body;

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any;
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (complaintResult !== undefined) {
    updates.push('result = ?');
    params.push(complaintResult);
  }

  if (status === 'resolved' || status === 'closed') {
    updates.push('resolved_at = datetime(\'now\')');
  }

  if (updates.length === 0) {
    res.status(400).json({ error: '没有需要更新的字段' });
    return;
  }

  params.push(id);

  const info = db.prepare(`
    UPDATE complaints SET ${updates.join(', ')} WHERE id = ?
  `).run(...params);

  if (info.changes > 0) {
    const updated = db.prepare(`
      SELECT c.*, 
             s.name as student_name, s.avatar as student_avatar,
             comp.name as company_name, comp.avatar as company_avatar,
             j.title as job_title
      FROM complaints c
      LEFT JOIN students s ON c.student_id = s.id
      LEFT JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN jobs j ON c.job_id = j.id
      WHERE c.id = ?
    `).get(id) as any;

    const result: Complaint = {
      ...complaintToResponse(updated),
      student: {
        id: updated.student_id,
        name: updated.student_name,
        avatar: updated.student_avatar,
      } as Student,
      company: {
        id: updated.company_id,
        name: updated.company_name,
        avatar: updated.company_avatar,
      } as Company,
      job: {
        id: updated.job_id,
        title: updated.job_title,
      } as Job,
    };

    res.json(result);
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

export default router;
