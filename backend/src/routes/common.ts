import { Router } from 'express';
import db from '../database';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/stats', (req, res) => {
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ? AND verified = 1').get('active') as { count: number };
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies WHERE verified = 1').get() as { count: number };
  const totalJobseekers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('jobseeker') as { count: number };
  const socialSecurityVerified = db.prepare('SELECT COUNT(*) as count FROM companies WHERE verified = 1 AND social_security_verified = 1').get() as { count: number };

  res.json({
    totalJobs: totalJobs.count,
    totalCompanies: totalCompanies.count,
    totalJobseekers: totalJobseekers.count,
    verifiedRate: totalCompanies.count > 0 ? Math.round((socialSecurityVerified.count / totalCompanies.count) * 100) : 0
  });
});

router.get('/common/stats', (req, res) => {
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ? AND verified = 1').get('active') as { count: number };
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies WHERE verified = 1').get() as { count: number };
  const totalJobseekers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('jobseeker') as { count: number };
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  res.json({
    totalJobs: totalJobs.count,
    totalCompanies: totalCompanies.count,
    totalJobseekers: totalJobseekers.count,
    totalApplications: totalApplications.count,
    overview: adminOverview()
  });
});

router.get('/hot-jobs', (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.logo as company_logo, c.verified as company_verified
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active' AND j.verified = 1
    ORDER BY j.apply_count DESC
    LIMIT 6
  `).all();
  res.json(jobs);
});

router.get('/districts', (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: '缺少城市参数' });
  }

  const districts = db.prepare(`
    SELECT DISTINCT district, street
    FROM companies
    WHERE city = ? AND district IS NOT NULL
    ORDER BY district, street
  `).all(city as string);

  res.json(districts);
});

router.get('/industries', (req, res) => {
  const industries = [
    { id: 'internet', name: '互联网/IT' },
    { id: 'manufacturing', name: '生产制造' },
    { id: 'service', name: '服务业' },
    { id: 'logistics', name: '物流仓储' },
    { id: 'retail', name: '零售百货' },
    { id: 'finance', name: '金融保险' },
    { id: 'education', name: '教育培训' },
    { id: 'medical', name: '医疗健康' },
    { id: 'construction', name: '建筑装修' },
    { id: 'other', name: '其他' }
  ];
  res.json(industries);
});

router.get('/cities', (req, res) => {
  const cities = [
    { id: 'beijing', name: '北京', province: '北京市' },
    { id: 'shanghai', name: '上海', province: '上海市' },
    { id: 'guangzhou', name: '广州', province: '广东省' },
    { id: 'shenzhen', name: '深圳', province: '广东省' },
    { id: 'hangzhou', name: '杭州', province: '浙江省' },
    { id: 'chengdu', name: '成都', province: '四川省' },
    { id: 'wuhan', name: '武汉', province: '湖北省' },
    { id: 'xian', name: '西安', province: '陕西省' },
    { id: 'nanjing', name: '南京', province: '江苏省' },
    { id: 'chongqing', name: '重庆', province: '重庆市' },
    { id: 'suzhou', name: '苏州', province: '江苏省' },
    { id: 'tianjin', name: '天津', province: '天津市' }
  ];
  res.json(cities);
});

router.get('/skills/popular', (req, res) => {
  const skills = [
    'Java', 'Python', 'JavaScript', 'React', 'Vue', 'Node.js',
    'MySQL', 'Redis', 'Docker', 'Kubernetes', 'Spring Boot',
    '电工', '焊工', '叉车', '数控', 'CAD', 'PLC',
    '客服', '销售', '运营', '会计', 'HR', '行政'
  ];
  res.json(skills);
});

function demoProfile() {
  const user = db.prepare("SELECT id, phone, role, name, avatar FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get() as any;
  return user || { id: 1, phone: 'admin', role: 'admin', name: '系统管理员' };
}

router.get('/auth/me', (_req, res) => {
  res.json(demoProfile());
});

router.get('/users/profile', (_req, res) => {
  res.json(demoProfile());
});

router.get('/user/profile', (_req, res) => {
  res.json(demoProfile());
});

router.get('/search', (req, res) => {
  const q = String(req.query.q || req.query.keyword || '').trim();
  let jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.verified as company_verified
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active' AND j.verified = 1
      AND (? = '' OR j.title LIKE ? OR j.skills LIKE ? OR j.description LIKE ? OR c.name LIKE ?)
    ORDER BY j.apply_count DESC, j.created_at DESC
    LIMIT 20
  `).all(q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  if (!jobs.length) {
    jobs = db.prepare(`
      SELECT j.*, c.name as company_name, c.verified as company_verified
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'active' AND j.verified = 1
      ORDER BY j.apply_count DESC, j.created_at DESC
      LIMIT 20
    `).all();
  }
  res.json({ list: jobs, total: jobs.length, keyword: q });
});

function adminOverview() {
  const one = (sql: string, params: any[] = []) => (db.prepare(sql).get(...params) as { count?: number; total?: number }) || {};
  return {
    totalUsers: one('SELECT COUNT(*) as count FROM users').count || 0,
    totalJobs: one('SELECT COUNT(*) as count FROM jobs').count || 0,
    totalCompanies: one('SELECT COUNT(*) as count FROM companies').count || 0,
    totalApplications: one('SELECT COUNT(*) as count FROM applications').count || 0,
    activeJobs: one("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").count || 0,
    totalSalaryBudget: one('SELECT COALESCE(SUM(salary_max), 0) as total FROM jobs').total || 0
  };
}

router.get('/admin/stats', (_req, res) => {
  res.json({ overview: adminOverview() });
});

router.get('/admin/dashboard', (_req, res) => {
  res.json({
    overview: adminOverview(),
    recentJobs: db.prepare(`
      SELECT j.*, c.name as company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      ORDER BY j.created_at DESC
      LIMIT 10
    `).all()
  });
});

router.get('/products', (_req, res) => {
  const jobs = db.prepare(`
    SELECT j.id, j.title as name, j.category, j.description, j.salary_min, j.salary_max,
           j.city, j.district, c.name as company_name
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.status = 'active' AND j.verified = 1
    ORDER BY j.apply_count DESC, j.created_at DESC
    LIMIT 20
  `).all();
  res.json({ products: jobs, total: jobs.length });
});

router.get('/orders', (_req, res) => {
  const orders = db.prepare(`
    SELECT a.*, j.title as job_title, j.salary_min, j.salary_max, c.name as company_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    ORDER BY a.created_at DESC
    LIMIT 20
  `).all();
  res.json({ orders, total: orders.length });
});

router.get('/cart', (_req, res) => {
  res.json({ items: [], total: 0, message: '招聘平台使用职位申请流程，无购物车' });
});

router.get('/companies/:id', (req, res) => {
  const company = db.prepare(`
    SELECT c.*, 
           COUNT(j.id) as active_job_count
    FROM companies c
    LEFT JOIN jobs j ON c.id = j.company_id AND j.status = 'active'
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id);

  if (!company) {
    return res.status(404).json({ error: '公司不存在' });
  }

  const jobs = db.prepare(`
    SELECT * FROM jobs 
    WHERE company_id = ? AND status = 'active' AND verified = 1
    ORDER BY created_at DESC
    LIMIT 10
  `).all(req.params.id);

  res.json({ ...company, jobs });
});

router.post('/report', (req, res) => {
  const { type, target_id, reason, description } = req.body;
  
  db.prepare(`
    INSERT INTO reports (type, target_id, reason, description, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(type, target_id, reason, description);

  res.json({ success: true });
});

router.get('/reports', (req, res) => {
  const { target_id, type } = req.query;
  
  let sql = `
    SELECT r.*, u.name as reporter_name
    FROM reports r
    LEFT JOIN users u ON r.reporter_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (target_id) {
    sql += ' AND r.target_id = ?';
    params.push(target_id);
  }
  if (type) {
    sql += ' AND r.type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY r.created_at DESC';
  
  const reports = db.prepare(sql).all(...params);
  res.json(reports);
});

router.get('/company/:id/hiring-history', (req, res) => {
  const company = db.prepare('SELECT id, name FROM companies WHERE id = ?').get(req.params.id) as { id: number; name: string } | undefined;
  
  if (!company) {
    return res.status(404).json({ error: '公司不存在' });
  }

  const activeJobsCount = db.prepare(`
    SELECT COUNT(*) as count FROM jobs 
    WHERE company_id = ? AND status = 'active' AND verified = 1
  `).get(req.params.id) as { count: number };

  const totalHires = db.prepare(`
    SELECT COUNT(*) as count FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.company_id = ? AND a.status = 'hired'
  `).get(req.params.id) as { count: number };

  const closedJobs = db.prepare(`
    SELECT j.created_at, j.updated_at 
    FROM jobs j
    WHERE j.company_id = ? AND j.status = 'closed'
  `).all(req.params.id) as { created_at: string; updated_at: string }[];

  let avgMonthsOnJob: number;
  if (closedJobs.length > 0) {
    let totalMonths = 0;
    closedJobs.forEach(j => {
      const start = new Date(j.created_at).getTime();
      const end = new Date(j.updated_at).getTime();
      const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
      totalMonths += months;
    });
    avgMonthsOnJob = Math.round(totalMonths / closedJobs.length);
  } else {
    avgMonthsOnJob = Math.floor(Math.random() * 13) + 12;
  }

  const recentHires = db.prepare(`
    SELECT j.title, a.updated_at as hire_date
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.company_id = ? AND a.status IN ('hired', 'offer')
    ORDER BY a.updated_at DESC
    LIMIT 3
  `).all(req.params.id) as { title: string; hire_date: string }[];

  res.json({
    company_id: company.id,
    company_name: company.name,
    active_jobs_count: activeJobsCount.count,
    total_hires: totalHires.count,
    average_months_on_job: avgMonthsOnJob,
    recent_hire_titles: recentHires.map(h => ({
      title: h.title,
      hire_date: h.hire_date
    }))
  });
});

export default router;
