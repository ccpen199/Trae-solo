import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Job, FilingForm, MatchResult, Company } from '../../shared/types.js';

const router = Router();

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

function filingFormToResponse(form: any): FilingForm {
  return {
    id: form.id,
    jobId: form.job_id,
    companyId: form.company_id,
    maxHoursPerDay: form.max_hours_per_day,
    maxHoursPerWeek: form.max_hours_per_week,
    minWage: form.min_wage,
    insuranceProvided: !!form.insurance_provided,
    insuranceType: form.insurance_type,
    safetyMeasures: form.safety_measures,
    emergencyContact: form.emergency_contact,
    emergencyPhone: form.emergency_phone,
    filedAt: form.filed_at,
  };
}

router.get('/', (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const size = parseInt(req.query.size as string) || 10;
  const keyword = req.query.keyword as string || '';
  const salaryMin = parseFloat(req.query.salaryMin as string) || 0;
  const location = req.query.location as string || '';
  const major = req.query.major as string || '';

  let whereClauses: string[] = ["j.status = 'published'"];
  let params: any[] = [];

  if (keyword) {
    whereClauses.push('(j.title LIKE ? OR j.description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (salaryMin > 0) {
    whereClauses.push('j.salary_per_hour >= ?');
    params.push(salaryMin);
  }

  if (location) {
    whereClauses.push('j.location LIKE ?');
    params.push(`%${location}%`);
  }

  if (major) {
    whereClauses.push('j.major_required LIKE ?');
    params.push(`%${major}%`);
  }

  const whereSql = whereClauses.join(' AND ');
  const offset = (page - 1) * size;

  const countResult = db.prepare(
    `SELECT COUNT(*) as total FROM jobs j WHERE ${whereSql}`
  ).get(...params) as { total: number };

  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.avatar as company_avatar 
    FROM jobs j 
    LEFT JOIN companies c ON j.company_id = c.id 
    WHERE ${whereSql}
    ORDER BY j.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, size, offset) as any[];

  const jobList = jobs.map(j => {
    const job = jobToResponse(j);
    const appCount = db.prepare(
      'SELECT COUNT(*) as count FROM applications WHERE job_id = ?'
    ).get(j.id) as { count: number };
    return {
      ...job,
      company: {
        id: j.company_id,
        name: j.company_name,
        avatar: j.company_avatar,
      },
      applicationCount: appCount.count,
    };
  });

  res.json({
    list: jobList,
    total: countResult.total,
    page,
    size,
  });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const job = db.prepare(`
    SELECT j.*, c.* 
    FROM jobs j 
    LEFT JOIN companies c ON j.company_id = c.id 
    WHERE j.id = ?
  `).get(id) as any;

  if (!job) {
    res.status(404).json({ error: '岗位不存在' });
    return;
  }

  const filingForm = db.prepare(
    'SELECT * FROM filing_forms WHERE job_id = ?'
  ).get(id) as any;

  const appCount = db.prepare(
    'SELECT COUNT(*) as count FROM applications WHERE job_id = ?'
  ).get(id) as { count: number };

  const result = {
    ...jobToResponse(job),
    company: companyToResponse(job),
    filingForm: filingForm ? filingFormToResponse(filingForm) : null,
    applicationCount: appCount.count,
  };

  res.json(result);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  if (req.userRole !== 'company') {
    res.status(403).json({ error: '只有企业可以发布岗位' });
    return;
  }

  const db = getDb();
  const { title, description, location, salaryPerHour, maxHoursPerDay, maxHoursPerWeek, majorRequired, workDays, workStartTime, workEndTime, filingForm } = req.body;

  const jobId = Math.random().toString(36).substring(2, 15);
  const companyId = req.userId;

  const jobInfo = db.prepare(`
    INSERT INTO jobs 
    (id, company_id, title, description, location, salary_per_hour, max_hours_per_day, max_hours_per_week, 
     major_required, work_days, work_start_time, work_end_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
  `).run(
    jobId, companyId, title, description, location, salaryPerHour,
    maxHoursPerDay, maxHoursPerWeek, JSON.stringify(majorRequired || []),
    JSON.stringify(workDays || []), workStartTime, workEndTime
  );

  if (filingForm) {
    const formId = Math.random().toString(36).substring(2, 15);
    db.prepare(`
      INSERT INTO filing_forms 
      (id, job_id, company_id, max_hours_per_day, max_hours_per_week, min_wage, 
       insurance_provided, insurance_type, safety_measures, emergency_contact, emergency_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      formId, jobId, companyId,
      filingForm.maxHoursPerDay || maxHoursPerDay,
      filingForm.maxHoursPerWeek || maxHoursPerWeek,
      filingForm.minWage || salaryPerHour,
      filingForm.insuranceProvided ? 1 : 0,
      filingForm.insuranceType,
      filingForm.safetyMeasures,
      filingForm.emergencyContact,
      filingForm.emergencyPhone
    );
  }

  if (jobInfo.changes > 0) {
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    res.json(jobToResponse(newJob));
  } else {
    res.status(500).json({ error: '发布失败' });
  }
});

router.get('/match/results', authMiddleware, (req: AuthRequest, res) => {
  if (req.userRole !== 'student') {
    res.status(403).json({ error: '只有学生可以使用智能匹配' });
    return;
  }

  const db = getDb();
  const studentId = req.userId;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!student) {
    res.status(404).json({ error: '学生不存在' });
    return;
  }

  const scheduleRow = db.prepare(
    'SELECT * FROM schedules WHERE student_id = ?'
  ).get(studentId) as any;
  const studentCourses = scheduleRow ? JSON.parse(scheduleRow.courses || '[]') : [];

  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.avatar as company_avatar 
    FROM jobs j 
    LEFT JOIN companies c ON j.company_id = c.id 
    WHERE j.status = 'published'
    ORDER BY j.created_at DESC
    LIMIT 20
  `).all() as any[];

  const results: MatchResult[] = jobs.map(job => {
    const jobMajors: string[] = JSON.parse(job.major_required || '[]');
    const majorMatch = calculateMajorMatch(student.major, jobMajors);
    
    const jobWorkDays: string[] = JSON.parse(job.work_days || '[]');
    const scheduleMatch = calculateScheduleMatch(studentCourses, jobWorkDays, job.work_start_time, job.work_end_time);
    
    const ratingScore = (student.rating || 5) / 5 * 100;

    const score = Math.round(majorMatch * 0.4 + scheduleMatch * 0.35 + ratingScore * 0.25);

    const reasons: string[] = [];
    if (majorMatch >= 80) reasons.push('专业高度匹配');
    else if (majorMatch >= 50) reasons.push('专业部分匹配');
    
    if (scheduleMatch >= 80) reasons.push('空闲时段高度匹配');
    else if (scheduleMatch >= 50) reasons.push('部分时段可用');
    
    if (ratingScore >= 90) reasons.push('历史评价优秀');

    const jobData = jobToResponse(job);
    const appCount = db.prepare(
      'SELECT COUNT(*) as count FROM applications WHERE job_id = ?'
    ).get(job.id) as { count: number };

    return {
      job: {
        ...jobData,
        company: {
          id: job.company_id,
          name: job.company_name,
          avatar: job.company_avatar,
        },
        applicationCount: appCount.count,
      } as Job,
      score,
      breakdown: {
        majorMatch: Math.round(majorMatch),
        scheduleMatch: Math.round(scheduleMatch),
        ratingScore: Math.round(ratingScore),
      },
      reasons,
    };
  });

  results.sort((a, b) => b.score - a.score);

  res.json({
    matches: results.slice(0, 10),
  });
});

function calculateMajorMatch(studentMajor: string, jobMajors: string[]): number {
  if (!jobMajors || jobMajors.length === 0) return 70;
  
  for (const jobMajor of jobMajors) {
    if (studentMajor === jobMajor) return 100;
    if (studentMajor.includes(jobMajor) || jobMajor.includes(studentMajor)) return 80;
  }
  
  const majorCategories: Record<string, string[]> = {
    '计算机': ['计算机科学与技术', '软件工程', '电子信息', '人工智能', '数据科学'],
    '设计': ['工业设计', '视觉传达', '数字媒体', '交互设计', '产品设计'],
    '金融': ['金融学', '经济学', '会计学', '财务管理', '统计学'],
    '市场': ['市场营销', '广告学', '传播学', '新闻学', '工商管理'],
    '语言': ['英语专业', '汉语言文学', '翻译', '日语', '法语'],
  };
  
  for (const [category, majors] of Object.entries(majorCategories)) {
    const studentInCategory = majors.some(m => studentMajor.includes(m));
    const jobInCategory = jobMajors.some(jm => majors.some(m => jm.includes(m)));
    if (studentInCategory && jobInCategory) return 60;
  }
  
  return 30;
}

function calculateScheduleMatch(
  studentCourses: any[],
  jobWorkDays: string[],
  startTime: string,
  endTime: string
): number {
  if (!jobWorkDays || jobWorkDays.length === 0) return 80;
  if (!studentCourses || studentCourses.length === 0) return 100;

  const dayMap: Record<string, number> = {
    '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0,
  };

  const workStartHour = parseInt(startTime?.split(':')[0] || '9');
  const workEndHour = parseInt(endTime?.split(':')[0] || '18');

  let matchedDays = 0;
  for (const workDay of jobWorkDays) {
    const dayNum = dayMap[workDay];
    if (dayNum === undefined) continue;

    const dayCourses = studentCourses.filter((c: any) => c.day === dayNum);
    
    if (dayCourses.length === 0) {
      matchedDays++;
    } else {
      const workPeriods = timeToPeriods(workStartHour, workEndHour);
      const coursePeriods = new Set<number>();
      dayCourses.forEach((c: any) => {
        for (let p = c.startPeriod; p <= c.endPeriod; p++) {
          coursePeriods.add(p);
        }
      });
      
      let conflictCount = 0;
      workPeriods.forEach(p => {
        if (coursePeriods.has(p)) conflictCount++;
      });
      
      if (conflictCount === 0) {
        matchedDays++;
      } else if (conflictCount < workPeriods.length / 2) {
        matchedDays += 0.5;
      }
    }
  }

  return Math.round((matchedDays / jobWorkDays.length) * 100);
}

function timeToPeriods(startHour: number, endHour: number): number[] {
  const periods: number[] = [];
  const startPeriod = Math.max(1, Math.floor((startHour - 8) / 1.5) + 1);
  const endPeriod = Math.min(12, Math.floor((endHour - 8) / 1.5) + 1);
  
  for (let i = startPeriod; i <= endPeriod; i++) {
    periods.push(i);
  }
  return periods;
}

export default router;
