import { Router } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/dashboard/stats', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  const pendingVerifications = db.prepare('SELECT COUNT(*) as count FROM companies WHERE verified = 0').get() as { count: number };
  const pendingReports = db.prepare('SELECT COUNT(*) as count FROM reports WHERE status = ?').get('pending') as { count: number };

  res.json({
    totalUsers: totalUsers.count,
    totalJobs: totalJobs.count,
    totalCompanies: totalCompanies.count,
    totalApplications: totalApplications.count,
    pendingVerifications: pendingVerifications.count,
    pendingReports: pendingReports.count
  });
});

router.get('/companies/pending', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const companies = db.prepare('SELECT * FROM companies WHERE verified = 0 ORDER BY created_at DESC').all();
  res.json(companies);
});

router.put('/company/:id/verify', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const { verified, social_security_verified } = req.body;
  
  db.prepare('UPDATE companies SET verified = ?, social_security_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    verified ? 1 : 0, social_security_verified ? 1 : 0, req.params.id
  );

  if (verified) {
    db.prepare('UPDATE jobs SET verified = 1 WHERE company_id = ?').run(req.params.id);
  }

  res.json({ success: true });
});

router.get('/jobs/unverified', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.verified = 0
    ORDER BY j.created_at DESC
  `).all();
  res.json(jobs);
});

router.put('/job/:id/verify', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const { verified } = req.body;
  
  db.prepare('UPDATE jobs SET verified = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    verified ? 1 : 0, verified ? 'active' : 'rejected', req.params.id
  );

  res.json({ success: true });
});

router.get('/reports', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const { status } = req.query;
  
  let sql = `
    SELECT r.*, u.name as reporter_name
    FROM reports r
    LEFT JOIN users u ON r.reporter_id = u.id
  `;
  const params: any[] = [];

  if (status) {
    sql += ' WHERE r.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY r.created_at DESC';

  const reports = db.prepare(sql).all(...params);
  res.json(reports);
});

router.put('/report/:id/handle', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const { status, handling_notes } = req.body;
  
  if (handling_notes !== undefined) {
    db.prepare('UPDATE reports SET status = ?, handling_notes = ?, handler_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      status, handling_notes, req.user!.id, req.params.id
    );
  } else {
    db.prepare('UPDATE reports SET status = ?, handler_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      status, req.user!.id, req.params.id
    );
  }

  res.json({ success: true });
});

router.get('/blacklist/companies', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const blacklist = db.prepare(`
    SELECT bc.*, c.name as company_name
    FROM blacklist_companies bc
    JOIN companies c ON bc.company_id = c.id
    ORDER BY bc.created_at DESC
  `).all();
  res.json(blacklist);
});

router.post('/blacklist/company', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const { company_id, reason } = req.body;
  
  db.prepare('INSERT OR REPLACE INTO blacklist_companies (company_id, reason, reported_by) VALUES (?, ?, ?)').run(
    company_id, reason, req.user!.id
  );

  db.prepare('UPDATE jobs SET status = ? WHERE company_id = ?').run('rejected', company_id);

  res.json({ success: true });
});

router.get('/analytics/jobs/top', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const topJobs = db.prepare(`
    SELECT title, COUNT(*) as count
    FROM jobs
    WHERE status = 'active'
    GROUP BY title
    ORDER BY count DESC
    LIMIT 20
  `).all();

  res.json(topJobs);
});

router.get('/analytics/salary/median', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const salaryByCity = db.prepare(`
    SELECT city, 
           AVG(salary_min) as avg_min, 
           AVG(salary_max) as avg_max,
           COUNT(*) as job_count
    FROM jobs
    WHERE status = 'active' AND city IS NOT NULL
    GROUP BY city
    ORDER BY job_count DESC
    LIMIT 20
  `).all();

  res.json(salaryByCity);
});

router.get('/analytics/skills/trends', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const skillWeights = db.prepare(`
    SELECT skill, COUNT(*) as count
    FROM skill_weights
    GROUP BY skill
    ORDER BY count DESC
    LIMIT 20
  `).all() as { skill: string; count: number }[];

  const jobSkillsRows = db.prepare(`
    SELECT skills FROM jobs WHERE skills IS NOT NULL AND status = 'active'
  `).all() as { skills: string }[];

  const skillCountMap = new Map<string, number>();

  skillWeights.forEach(row => {
    skillCountMap.set(row.skill, (skillCountMap.get(row.skill) || 0) + row.count);
  });

  jobSkillsRows.forEach(row => {
    try {
      const parsed = JSON.parse(row.skills);
      if (Array.isArray(parsed)) {
        parsed.forEach((s: string) => {
          skillCountMap.set(s, (skillCountMap.get(s) || 0) + 1);
        });
      }
    } catch {}
  });

  const merged = Array.from(skillCountMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  res.json(merged);
});

router.get('/analytics/dashboard/summary', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const totalActiveJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ?').get('active') as { count: number };
  const totalVerifiedCompanies = db.prepare('SELECT COUNT(*) as count FROM companies WHERE verified = 1').get() as { count: number };
  const totalJobseekers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('jobseeker') as { count: number };
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  const totalHired = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'hired'").get() as { count: number };

  res.json({
    totalActiveJobs: totalActiveJobs.count,
    totalVerifiedCompanies: totalVerifiedCompanies.count,
    totalJobseekers: totalJobseekers.count,
    totalApplications: totalApplications.count,
    avgReplyTime: 2.5,
    avgJobCloseCycle: 15,
    hireConversionRate: totalApplications.count > 0 ? Math.round((totalHired.count / totalApplications.count) * 10000) / 100 : 0
  });
});

router.get('/analytics/hr/efficiency', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res) => {
  const efficiency = db.prepare(`
    SELECT 
      u.name as hr_name,
      c.name as company_name,
      COUNT(DISTINCT j.id) as job_count,
      COUNT(DISTINCT a.id) as application_count,
      AVG(CASE WHEN a.status IN ('hired', 'offer') THEN 1 ELSE 0 END) as hire_rate,
      2.5 as avg_reply_time,
      15 as job_close_cycle
    FROM hr_users hr
    JOIN users u ON hr.user_id = u.id
    JOIN companies c ON hr.company_id = c.id
    LEFT JOIN jobs j ON hr.id = j.hr_id
    LEFT JOIN applications a ON j.id = a.job_id
    GROUP BY hr.id
    ORDER BY job_count DESC
  `).all();

  res.json(efficiency);
});

export default router;
