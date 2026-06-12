import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest, rbacMiddleware, auditMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { keyword, location, industry, experienceLevel, salaryMin } = req.query;
  let sql = 'SELECT j.*, u.name as hr_name FROM jobs j LEFT JOIN users u ON j.hr_id = u.id WHERE j.status = ?';
  const params: any[] = ['open'];
  if (req.user!.role === 'hr') {
    sql = 'SELECT j.*, u.name as hr_name FROM jobs j LEFT JOIN users u ON j.hr_id = u.id WHERE j.tenant_id = ?';
    params.splice(0, 1, req.user!.tenantId);
  }
  if (keyword) { sql += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.department LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (location) { sql += ' AND j.location LIKE ?'; params.push(`%${location}%`); }
  if (industry) { sql += ' AND j.industry = ?'; params.push(industry); }
  if (experienceLevel) { sql += ' AND j.experience_level = ?'; params.push(experienceLevel); }
  if (salaryMin) { sql += ' AND j.salary_max >= ?'; params.push(parseInt(salaryMin as string)); }
  sql += ' ORDER BY j.created_at DESC LIMIT 100';
  const jobs = db.prepare(sql).all(...params);
  res.json({ jobs: jobs.map((j: any) => ({ ...j, skills: j.skills ? JSON.parse(j.skills) : [], requirements: j.requirements ? JSON.parse(j.requirements) : [] })) });
});

router.post('/', authMiddleware, rbacMiddleware('job', 'create'), auditMiddleware('create_job', 'job'), (req: AuthRequest, res) => {
  const { title, department, description, requirements = [], skills = [], location, salaryMin, salaryMax, experienceLevel, educationLevel, industry } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO jobs (id, tenant_id, hr_id, title, department, description, requirements, skills, location, salary_min, salary_max, experience_level, education_level, industry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.tenantId, req.user!.id, title, department, description,
    JSON.stringify(requirements), JSON.stringify(skills), location, salaryMin, salaryMax, experienceLevel, educationLevel, industry
  );
  res.json({ id });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const j = db.prepare('SELECT j.*, u.name as hr_name FROM jobs j LEFT JOIN users u ON j.hr_id = u.id WHERE j.id = ?').get(req.params.id) as any;
  if (!j) return res.status(404).json({ error: '岗位不存在' });
  res.json({ job: { ...j, skills: j.skills ? JSON.parse(j.skills) : [], requirements: j.requirements ? JSON.parse(j.requirements) : [] } });
});

router.put('/:id', authMiddleware, rbacMiddleware('job', 'update'), auditMiddleware('update_job', 'job'), (req: AuthRequest, res) => {
  const { title, department, description, requirements, skills, location, salaryMin, salaryMax, experienceLevel, educationLevel, industry, status } = req.body;
  db.prepare(`UPDATE jobs SET title = COALESCE(?, title), department = COALESCE(?, department), description = COALESCE(?, description), requirements = COALESCE(?, requirements), skills = COALESCE(?, skills), location = COALESCE(?, location), salary_min = COALESCE(?, salary_min), salary_max = COALESCE(?, salary_max), experience_level = COALESCE(?, experience_level), education_level = COALESCE(?, education_level), industry = COALESCE(?, industry), status = COALESCE(?, status) WHERE id = ? AND tenant_id = ?`).run(
    title, department, description, requirements ? JSON.stringify(requirements) : null,
    skills ? JSON.stringify(skills) : null, location, salaryMin, salaryMax, experienceLevel, educationLevel, industry, status, req.params.id, req.user!.tenantId
  );
  res.json({ success: true });
});

router.post('/:id/apply', authMiddleware, rbacMiddleware('application', 'create'), auditMiddleware('apply_job', 'application'), (req: AuthRequest, res) => {
  const j = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any;
  if (!j || j.status !== 'open') return res.status(400).json({ error: '岗位不可用' });
  const resume = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(req.user!.id) as any;
  if (!resume) return res.status(400).json({ error: '请先创建简历' });
  const exist = db.prepare('SELECT id FROM job_applications WHERE job_id = ? AND applicant_id = ?').get(req.params.id, req.user!.id);
  if (exist) return res.status(400).json({ error: '已投递过该岗位' });
  const id = uuidv4();
  db.prepare('INSERT INTO job_applications (id, job_id, resume_id, applicant_id, tenant_id, status) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.params.id, resume.id, req.user!.id, j.tenant_id, 'pending');
  res.json({ id });
});

router.get('/applications/list', authMiddleware, (req: AuthRequest, res) => {
  let sql = 'SELECT ja.*, j.title as job_title, u.name as applicant_name, r.title as resume_title FROM job_applications ja LEFT JOIN jobs j ON ja.job_id = j.id LEFT JOIN users u ON ja.applicant_id = u.id LEFT JOIN resumes r ON ja.resume_id = r.id';
  const params: any[] = [];
  if (req.user!.role === 'hr') {
    sql += ' WHERE ja.tenant_id = ?';
    params.push(req.user!.tenantId);
  } else {
    sql += ' WHERE ja.applicant_id = ?';
    params.push(req.user!.id);
  }
  sql += ' ORDER BY ja.created_at DESC LIMIT 100';
  const applications = db.prepare(sql).all(...params);
  res.json({ applications });
});

router.put('/applications/:id/status', authMiddleware, rbacMiddleware('application', 'update'), auditMiddleware('update_application', 'application'), (req: AuthRequest, res) => {
  const { status } = req.body;
  db.prepare('UPDATE job_applications SET status = ? WHERE id = ? AND tenant_id = ?').run(status, req.params.id, req.user!.tenantId);
  res.json({ success: true });
});

export default router;
