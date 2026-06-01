import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import authMiddleware, { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { job_type, status, lat, lng, radius = 50, page = 1, limit = 20, skill, search } = req.query;

    let query = `
      SELECT j.*, e.company_name, e.average_rating as employer_rating,
      (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM jobs j WHERE 1=1';
    let params: any[] = [];

    if (job_type) {
      query += ' AND j.job_type = ?';
      countQuery += ' AND job_type = ?';
      params.push(job_type);
    }

    if (status) {
      query += ' AND j.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    } else {
      query += " AND j.status = 'open'";
      countQuery += " AND status = 'open'";
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ?)';
      countQuery += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const jobs = db.prepare(query).all(...params);

    const countParams = params.slice(0, params.length - 2);
    const countResult = db.prepare(countQuery).all(...countParams) as any[];
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, error: '获取岗位列表失败' });
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    let jobs: any[] = [];

    if (user.role === 'employer') {
      const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;
      jobs = db.prepare(`
        SELECT j.*,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count
        FROM jobs j
        WHERE j.employer_id = ?
        ORDER BY j.created_at DESC
      `).all(employer.id);
    } else if (user.role === 'job_seeker') {
      const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;
      jobs = db.prepare(`
        SELECT j.*, e.company_name, ja.status as application_status
        FROM jobs j
        JOIN employers e ON j.employer_id = e.id
        JOIN job_applications ja ON ja.job_id = j.id AND ja.job_seeker_id = ?
        ORDER BY ja.applied_at DESC
      `).all(jobSeeker.id);
    }

    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ success: false, error: '获取我的岗位失败' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = db.prepare(`
      SELECT j.*, e.company_name, e.company_type, e.average_rating as employer_rating,
      (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ?
    `).get(id);

    if (!job) {
      res.status(404).json({ success: false, error: '岗位不存在' });
      return;
    }

    const applications = db.prepare(`
      SELECT ja.*, u.name, u.avatar_url, js.credit_score, js.onboarding_effectiveness_hours
      FROM job_applications ja
      JOIN job_seekers js ON ja.job_seeker_id = js.id
      JOIN users u ON js.user_id = u.id
      WHERE ja.job_id = ?
      ORDER BY ja.applied_at DESC
    `).all(id);

    res.json({ success: true, data: { ...job, applications } });
  } catch (error) {
    console.error('Get job detail error:', error);
    res.status(500).json({ success: false, error: '获取岗位详情失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    if (user.role !== 'employer') {
      res.status(403).json({ success: false, error: '只有雇主可以发布岗位' });
      return;
    }

    const {
      title,
      description,
      job_type,
      salary_type,
      salary_amount,
      location_address,
      location_lat,
      location_lng,
      required_skills,
      required_experience,
      start_date,
      end_date,
      working_hours,
      max_applicants = 10
    } = req.body;

    if (!title || !job_type || !salary_type || !salary_amount) {
      res.status(400).json({ success: false, error: '标题、岗位类型、薪资类型和薪资金额为必填项' });
      return;
    }

    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;
    const jobId = uuidv4();

    db.prepare(`
      INSERT INTO jobs (
        id, employer_id, title, description, job_type, salary_type, salary_amount,
        location_address, location_lat, location_lng, required_skills, required_experience,
        start_date, end_date, working_hours, max_applicants
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      jobId, employer.id, title, description || null, job_type, salary_type, salary_amount,
      location_address || null, location_lat || null, location_lng || null, required_skills || null,
      required_experience || null, start_date || null, end_date || null, working_hours || null, max_applicants
    );

    db.prepare('UPDATE employers SET total_posted_jobs = total_posted_jobs + 1 WHERE id = ?').run(employer.id);

    res.status(201).json({ success: true, message: '岗位发布成功', data: { id: jobId } });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ success: false, error: '发布岗位失败' });
  }
});

router.post('/:id/apply', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { cover_letter } = req.body;

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'job_seeker') {
      res.status(403).json({ success: false, error: '只有求职者可以申请岗位' });
      return;
    }

    const job = db.prepare('SELECT id, status FROM jobs WHERE id = ?').get(id);
    if (!job) {
      res.status(404).json({ success: false, error: '岗位不存在' });
      return;
    }

    if (job.status !== 'open') {
      res.status(400).json({ success: false, error: '该岗位已停止招聘' });
      return;
    }

    const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;

    try {
      const applicationId = uuidv4();
      db.prepare(`
        INSERT INTO job_applications (id, job_id, job_seeker_id, cover_letter)
        VALUES (?, ?, ?, ?)
      `).run(applicationId, id, jobSeeker.id, cover_letter || null);
    } catch (e) {
      res.status(400).json({ success: false, error: '您已申请过该岗位' });
      return;
    }

    res.json({ success: true, message: '申请成功' });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ success: false, error: '申请岗位失败' });
  }
});

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'employer') {
      res.status(403).json({ success: false, error: '只有雇主可以更新岗位状态' });
      return;
    }

    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;

    const job = db.prepare('SELECT id FROM jobs WHERE id = ? AND employer_id = ?').get(id, employer.id);
    if (!job) {
      res.status(404).json({ success: false, error: '岗位不存在或无权限' });
      return;
    }

    db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ success: false, error: '更新状态失败' });
  }
});

router.put('/applications/:applicationId/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { applicationId } = req.params;
    const { status } = req.body;

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'employer') {
      res.status(403).json({ success: false, error: '只有雇主可以更新申请状态' });
      return;
    }

    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;

    const application = db.prepare(`
      SELECT ja.id FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = ? AND j.employer_id = ?
    `).get(applicationId, employer.id);

    if (!application) {
      res.status(404).json({ success: false, error: '申请不存在或无权限' });
      return;
    }

    db.prepare('UPDATE job_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, applicationId);

    res.json({ success: true, message: '申请状态更新成功' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, error: '更新申请状态失败' });
  }
});

router.get('/match/recommendations', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    if (user.role !== 'job_seeker') {
      res.status(403).json({ success: false, error: '只有求职者可以查看匹配推荐' });
      return;
    }

    const jobSeeker = db.prepare('SELECT id, location_lat, location_lng FROM job_seekers WHERE user_id = ?').get(userId) as any;

    const mySkills = db.prepare(`
      SELECT skill_id FROM job_seeker_skills WHERE job_seeker_id = ?
    `).all(jobSeeker.id).map((s: any) => s.skill_id);

    const jobs = db.prepare(`
      SELECT j.*, e.company_name, e.average_rating as employer_rating
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE j.status = 'open'
      ORDER BY j.created_at DESC
      LIMIT 20
    `).all();

    const scoredJobs = jobs.map((job: any) => {
      let score = 0;
      const requiredSkills = job.required_skills ? job.required_skills.split(',').map((s: string) => s.trim()) : [];

      requiredSkills.forEach((skill: string) => {
        if (mySkills.some((ms: string) => ms.includes(skill) || skill.includes(ms))) {
          score += 20;
        }
      });

      if (jobSeeker.location_lat && job.location_lat) {
        const distance = Math.sqrt(
          Math.pow(jobSeeker.location_lat - job.location_lat, 2) +
          Math.pow(jobSeeker.location_lng - job.location_lng, 2)
        );
        score += Math.max(0, 30 - distance * 100);
      }

      return { ...job, match_score: Math.min(score, 100) };
    });

    scoredJobs.sort((a: any, b: any) => b.match_score - a.match_score);

    res.json({ success: true, data: scoredJobs.slice(0, 10) });
  } catch (error) {
    console.error('Get match recommendations error:', error);
    res.status(500).json({ success: false, error: '获取匹配推荐失败' });
  }
});

router.get('/applications/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    if (user.role !== 'job_seeker') {
      res.status(403).json({ success: false, error: '只有求职者可以查看申请记录' });
      return;
    }

    const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;

    const applications = db.prepare(`
      SELECT ja.*, j.title, j.salary_amount, j.location_address, e.company_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE ja.job_seeker_id = ?
      ORDER BY ja.created_at DESC
    `).all(jobSeeker.id);

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, error: '获取申请记录失败' });
  }
});

export default router;
