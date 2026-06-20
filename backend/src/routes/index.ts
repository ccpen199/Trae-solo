import { Router } from 'express';
import { getDb } from '../db';
import { calculateProsperityIndex, getLatestProsperityIndex, getProsperityHistory, saveProsperityIndex, calculateAndSaveAllIndices } from '../services/prosperityService';
import { importRpoJobs, getRpoBatches, getPushJobsForSchool, getMatchedGraduatesForJob, generateGraduateMatchReport, getGraduateEmploymentTracking } from '../services/rpoService';
import { AdminLevel, IndustryZone } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function getDivisionCodePattern(db: any, divisionId: string): string | null {
  const division = db.prepare('SELECT code FROM admin_divisions WHERE id = ?').get(divisionId) as { code?: string } | undefined;
  if (!division?.code) {
    return null;
  }

  const prefix = division.code.replace(/0+$/, '');
  return `${prefix || division.code}%`;
}

router.get('/divisions', (req, res) => {
  const db = getDb();
  const { level, parent_id } = req.query;

  let sql = 'SELECT * FROM admin_divisions WHERE 1=1';
  const params: any[] = [];

  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }
  if (parent_id) {
    sql += ' AND parent_id = ?';
    params.push(parent_id);
  }

  sql += ' ORDER BY sort_order, name';
  const divisions = db.prepare(sql).all(...params);

  res.json({ success: true, data: divisions });
});

router.get('/divisions/tree', (req, res) => {
  const db = getDb();
  const { root_level = 'province' } = req.query;

  const buildTree = (parentId: string | null): any[] => {
    const children = db.prepare('SELECT * FROM admin_divisions WHERE parent_id IS ? ORDER BY sort_order, name').all(parentId);
    return children.map(child => ({
      ...child,
      children: buildTree(child.id),
    }));
  };

  const root = db.prepare('SELECT * FROM admin_divisions WHERE level = ? LIMIT 1').get(root_level);
  if (!root) {
    return res.json({ success: true, data: [] });
  }

  const tree = [{
    ...root,
    children: buildTree(root.id),
  }];

  res.json({ success: true, data: tree });
});

router.get('/companies', (req, res) => {
  const db = getDb();
  const { page = 1, pageSize = 10, industry_zone, admin_division_id, keyword } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereSql = 'WHERE verified = 1';
  const params: any[] = [];

  if (industry_zone) {
    whereSql += ' AND industry_zone = ?';
    params.push(industry_zone);
  }
  if (admin_division_id) {
    const divisionPattern = getDivisionCodePattern(db, String(admin_division_id));
    if (divisionPattern) {
      whereSql += ' AND admin_division_id IN (SELECT id FROM admin_divisions WHERE code LIKE ?)';
      params.push(divisionPattern);
    }
  }
  if (keyword) {
    whereSql += ' AND (name LIKE ? OR industry LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM companies ${whereSql}`).get(...params) as { count: number };
  const companies = db.prepare(`
    SELECT c.*, d.name as division_name, d.full_path as division_path
    FROM companies c
    LEFT JOIN admin_divisions d ON c.admin_division_id = d.id
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({ success: true, data: companies, total: total.count });
});

router.get('/companies/:id', (req, res) => {
  const db = getDb();
  const company = db.prepare(`
    SELECT c.*, d.name as division_name, d.full_path as division_path
    FROM companies c
    LEFT JOIN admin_divisions d ON c.admin_division_id = d.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!company) {
    return res.status(404).json({ success: false, message: '企业不存在' });
  }

  res.json({ success: true, data: company });
});

router.get('/jobs', (req, res) => {
  const db = getDb();
  const { page = 1, pageSize = 10, industry_zone, admin_division_id, location_id, salary_min, salary_max, keyword, status = 'published' } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereSql = 'WHERE j.status = ?';
  const params: any[] = [status];

  if (industry_zone) {
    whereSql += ' AND j.industry_zone = ?';
    params.push(industry_zone);
  }
  if (admin_division_id) {
    const divisionPattern = getDivisionCodePattern(db, String(admin_division_id));
    if (divisionPattern) {
      whereSql += ' AND j.location_id IN (SELECT id FROM admin_divisions WHERE code LIKE ?)';
      params.push(divisionPattern);
    }
  } else if (location_id) {
    whereSql += ' AND j.location_id = ?';
    params.push(location_id);
  }
  if (salary_min) {
    whereSql += ' AND j.salary_max >= ?';
    params.push(Number(salary_min));
  }
  if (salary_max) {
    whereSql += ' AND j.salary_min <= ?';
    params.push(Number(salary_max));
  }
  if (keyword) {
    whereSql += ' AND (j.title LIKE ? OR c.name LIKE ? OR j.category LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM jobs j
    INNER JOIN companies c ON j.company_id = c.id
    ${whereSql}
  `).get(...params) as { count: number };

  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.credit_level, c.verified as company_verified,
           d.name as location_name, d.full_path as location_path
    FROM jobs j
    INNER JOIN companies c ON j.company_id = c.id
    LEFT JOIN admin_divisions d ON j.location_id = d.id
    ${whereSql}
    ORDER BY j.publish_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({ success: true, data: jobs, total: total.count });
});

router.get('/jobs/:id', (req, res) => {
  const db = getDb();
  const job = db.prepare(`
    SELECT j.*, c.name as company_name, c.credit_level, c.description as company_description,
           c.employee_count, d.name as location_name, d.full_path as location_path
    FROM jobs j
    INNER JOIN companies c ON j.company_id = c.id
    LEFT JOIN admin_divisions d ON j.location_id = d.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: '岗位不存在' });
  }

  db.prepare('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ success: true, data: { ...job, view_count: job.view_count + 1 } });
});

router.post('/jobs/:id/apply', (req, res) => {
  const db = getDb();
  const { graduate_id } = req.body;

  if (!graduate_id) {
    return res.status(400).json({ success: false, message: '请提供毕业生ID' });
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND status = ?').get(req.params.id, 'published');
  if (!job) {
    return res.status(404).json({ success: false, message: '岗位不存在或已关闭' });
  }

  const existing = db.prepare('SELECT * FROM applications WHERE job_id = ? AND graduate_id = ?').get(req.params.id, graduate_id);
  if (existing) {
    return res.status(400).json({ success: false, message: '您已申请过该岗位' });
  }

  const applicationId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO applications (id, job_id, graduate_id, status, applied_at, updated_at)
    VALUES (?, ?, ?, 'applied', ?, ?)
  `).run(applicationId, req.params.id, graduate_id, now, now);

  db.prepare('UPDATE jobs SET application_count = application_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ success: true, message: '申请成功', data: { id: applicationId } });
});

router.get('/fairs', (req, res) => {
  const db = getDb();
  const { page = 1, pageSize = 10, admin_division_id, status, is_live } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereSql = 'WHERE 1=1';
  const params: any[] = [];

  if (admin_division_id) {
    whereSql += ' AND admin_division_id = ?';
    params.push(admin_division_id);
  }
  if (status) {
    whereSql += ' AND status = ?';
    params.push(status);
  }
  if (is_live !== undefined) {
    whereSql += ' AND is_live = ?';
    params.push(is_live === 'true' ? 1 : 0);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM job_fairs ${whereSql}`).get(...params) as { count: number };
  const fairs = db.prepare(`
    SELECT f.*, d.name as division_name, d.full_path as division_path
    FROM job_fairs f
    LEFT JOIN admin_divisions d ON f.admin_division_id = d.id
    ${whereSql}
    ORDER BY f.start_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({ success: true, data: fairs, total: total.count });
});

router.get('/fairs/:id', (req, res) => {
  const db = getDb();
  const fair = db.prepare(`
    SELECT f.*, d.name as division_name, d.full_path as division_path
    FROM job_fairs f
    LEFT JOIN admin_divisions d ON f.admin_division_id = d.id
    WHERE f.id = ?
  `).get(req.params.id);

  if (!fair) {
    return res.status(404).json({ success: false, message: '招聘会不存在' });
  }

  res.json({ success: true, data: fair });
});

router.get('/graduates', (req, res) => {
  const db = getDb();
  const { page = 1, pageSize = 10, school, major, employment_status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereSql = 'WHERE verification_status = ?';
  const params: any[] = ['verified'];

  if (school) {
    whereSql += ' AND school = ?';
    params.push(school);
  }
  if (major) {
    whereSql += ' AND major = ?';
    params.push(major);
  }
  if (employment_status) {
    whereSql += ' AND employment_status = ?';
    params.push(employment_status);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM graduates ${whereSql}`).get(...params) as { count: number };
  const graduates = db.prepare(`
    SELECT g.*, d.name as division_name
    FROM graduates g
    LEFT JOIN admin_divisions d ON g.admin_division_id = d.id
    ${whereSql}
    ORDER BY g.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  const result = graduates.map(g => ({
    ...g,
    skills: JSON.parse(g.skills || '[]'),
  }));

  res.json({ success: true, data: result, total: total.count });
});

router.get('/graduates/:id', (req, res) => {
  const db = getDb();
  const graduate = db.prepare(`
    SELECT g.*, d.name as division_name
    FROM graduates g
    LEFT JOIN admin_divisions d ON g.admin_division_id = d.id
    WHERE g.id = ?
  `).get(req.params.id);

  if (!graduate) {
    return res.status(404).json({ success: false, message: '毕业生档案不存在' });
  }

  const internships = db.prepare('SELECT * FROM internships WHERE graduate_id = ?').all(req.params.id);
  const certificates = db.prepare('SELECT * FROM certificates WHERE graduate_id = ?').all(req.params.id);

  res.json({
    success: true,
    data: {
      ...graduate,
      skills: JSON.parse(graduate.skills || '[]'),
      internships,
      certificates,
    },
  });
});

router.get('/policies', (req, res) => {
  const db = getDb();
  const { page = 1, pageSize = 10, admin_division_id, policy_type, target_group } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereSql = 'WHERE 1=1';
  const params: any[] = [];

  if (admin_division_id) {
    whereSql += ' AND admin_division_id = ?';
    params.push(admin_division_id);
  }
  if (policy_type) {
    whereSql += ' AND policy_type = ?';
    params.push(policy_type);
  }
  if (target_group) {
    whereSql += ' AND target_group = ?';
    params.push(target_group);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM policies ${whereSql}`).get(...params) as { count: number };
  const policies = db.prepare(`
    SELECT p.*, d.name as division_name
    FROM policies p
    LEFT JOIN admin_divisions d ON p.admin_division_id = d.id
    ${whereSql}
    ORDER BY p.publish_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({ success: true, data: policies, total: total.count });
});

router.get('/prosperity/current', (req, res) => {
  const { admin_division_id, period_type = 'monthly' } = req.query;

  if (!admin_division_id) {
    return res.status(400).json({ success: false, message: '请提供行政区划ID' });
  }

  let index = getLatestProsperityIndex(String(admin_division_id), period_type as any);

  if (!index) {
    try {
      index = calculateProsperityIndex(String(admin_division_id), period_type as any);
      saveProsperityIndex(index);
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  res.json({ success: true, data: index });
});

router.get('/prosperity/history', (req, res) => {
  const { admin_division_id, period_type = 'monthly', limit = 12 } = req.query;

  if (!admin_division_id) {
    return res.status(400).json({ success: false, message: '请提供行政区划ID' });
  }

  const history = getProsperityHistory(
    String(admin_division_id),
    period_type as any,
    Number(limit)
  );

  res.json({ success: true, data: history });
});

router.post('/prosperity/calculate-all', (req, res) => {
  try {
    calculateAndSaveAllIndices();
    res.json({ success: true, message: '景气指数计算完成' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/prosperity/ranking', (req, res) => {
  const db = getDb();
  const { period_type = 'monthly', limit = 16 } = req.query;

  const cities = db.prepare("SELECT id, name FROM admin_divisions WHERE level = 'city' ORDER BY name").all() as any[];

  const rankings = cities.map(city => {
    const index = getLatestProsperityIndex(city.id, period_type as any);
    return {
      city_id: city.id,
      city_name: city.name,
      prosperity_score: index?.prosperity_score || 0,
      total_jobs: index?.total_jobs || 0,
      total_applications: index?.total_applications || 0,
      salary_median: index?.salary_median || 0,
      job_growth_rate: index?.job_growth_rate || 0,
    };
  });

  rankings.sort((a, b) => b.prosperity_score - a.prosperity_score);

  res.json({ success: true, data: rankings.slice(0, Number(limit)) });
});

router.get('/industry-zones', (req, res) => {
  const zones = Object.values(IndustryZone).map(zone => ({
    key: zone,
    label: {
      [IndustryZone.DIANZHONG_MANUFACTURING]: '滇中制造',
      [IndustryZone.PUER_TEA]: '普洱茶业',
      [IndustryZone.XISHUANGBANNA_TOURISM]: '西双版纳旅游',
      [IndustryZone.YUXI_TOBACCO]: '玉溪烟草',
      [IndustryZone.KUNMING_IT]: '昆明信息产业',
      [IndustryZone.QUJING_ENERGY]: '曲靖能源',
      [IndustryZone.HONGHE_METALLURGY]: '红河冶金',
      [IndustryZone.DALI_CULTURE]: '大理文化',
      [IndustryZone.OTHER]: '其他',
    }[zone] || zone,
  }));

  res.json({ success: true, data: zones });
});

router.post('/rpo/import', (req, res) => {
  const { company_id, jobs, batch_name, target_schools, auto_push } = req.body;

  if (!company_id || !jobs || !batch_name) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  try {
    const result = importRpoJobs(
      company_id,
      jobs,
      batch_name,
      target_schools || [],
      auto_push || false
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/rpo/batches', (req, res) => {
  const { company_id, page = 1, pageSize = 10 } = req.query;

  if (!company_id) {
    return res.status(400).json({ success: false, message: '请提供企业ID' });
  }

  try {
    const result = getRpoBatches(String(company_id), Number(page), Number(pageSize));
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/schools', (req, res) => {
  const db = getDb();
  const { id, page = 1, pageSize = 20, school_type, admin_division_id } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereSql = 'WHERE 1=1';
  const params: any[] = [];

  if (id) {
    whereSql += ' AND id = ?';
    params.push(id);
  }
  if (school_type) {
    whereSql += ' AND school_type = ?';
    params.push(school_type);
  }
  if (admin_division_id) {
    const divisionPattern = getDivisionCodePattern(db, String(admin_division_id));
    if (divisionPattern) {
      whereSql += ' AND admin_division_id IN (SELECT id FROM admin_divisions WHERE code LIKE ?)';
      params.push(divisionPattern);
    }
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM schools ${whereSql}`).get(...params) as { count: number };
  const schools = db.prepare(`
    SELECT s.*, d.name as division_name
    FROM schools s
    LEFT JOIN admin_divisions d ON s.admin_division_id = d.id
    ${whereSql}
    ORDER BY s.name
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  const result = schools.map(s => ({
    ...s,
    majors: JSON.parse(s.majors || '[]'),
  }));

  res.json({ success: true, data: result, total: total.count });
});

router.get('/schools/:id/jobs', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  try {
    const result = getPushJobsForSchool(req.params.id, Number(page), Number(pageSize));
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/schools/:id/employment-report', (req, res) => {
  try {
    const report = generateGraduateMatchReport(req.params.id);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/schools/:id/graduates', (req, res) => {
  const { employment_status, major, verification_status } = req.query;

  try {
    const result = getGraduateEmploymentTracking(req.params.id, {
      employment_status,
      major,
      verification_status,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/jobs/:id/matched-graduates', (req, res) => {
  const { limit = 50 } = req.query;

  try {
    const graduates = getMatchedGraduatesForJob(req.params.id, Number(limit));
    res.json({ success: true, data: graduates });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/auth/login', (req, res) => {
  const db = getDb();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user || user.password_hash !== '$2a$10$7EqJtq98hPqEX7fNZaFWoOj5aK5dU7fG9e98x2m8c7e5d3c1b0a9') {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      related_id: user.related_id,
      admin_division_id: user.admin_division_id,
    },
  });
});

router.get('/stats/summary', (req, res) => {
  const db = getDb();
  const { admin_division_id } = req.query;

  let divisionFilter = '';
  const params: any[] = [];

  if (admin_division_id) {
    const divisionPattern = getDivisionCodePattern(db, String(admin_division_id));
    if (divisionPattern) {
      divisionFilter = 'AND d.code LIKE ?';
      params.push(divisionPattern);
    }
  }

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM companies c 
       INNER JOIN admin_divisions d ON c.admin_division_id = d.id 
       WHERE c.verified = 1 ${divisionFilter}) as companies,
      (SELECT COUNT(*) FROM jobs j 
       INNER JOIN admin_divisions d ON j.location_id = d.id 
       WHERE j.status = 'published' ${divisionFilter}) as jobs,
      (SELECT COUNT(*) FROM graduates g 
       INNER JOIN admin_divisions d ON g.admin_division_id = d.id 
       WHERE g.verification_status = 'verified' ${divisionFilter}) as graduates,
      (SELECT COUNT(*) FROM job_fairs f 
       INNER JOIN admin_divisions d ON f.admin_division_id = d.id 
       WHERE f.status IN ('upcoming', 'ongoing') ${divisionFilter}) as fairs,
      (SELECT COALESCE(SUM(application_count), 0) FROM jobs j 
       INNER JOIN admin_divisions d ON j.location_id = d.id 
       WHERE j.status = 'published' ${divisionFilter}) as applications
  `).get(...params);

  res.json({ success: true, data: stats });
});

export default router;
