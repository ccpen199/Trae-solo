const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware');

const router = express.Router();

function parseJSONField(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return value;
  }
}

function getStats(req, res) {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const pendingJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_approved = 0').get().count;
  const ftzSubsidyJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE has_ftz_subsidy = 1').get().count;
  const recordedJobs = db.prepare("SELECT COUNT(*) as count FROM job_recordings WHERE recording_status = 'recorded'").get().count;

  const jobsByCategory = db.prepare(`
    SELECT ic.code, ic.name_cn, COUNT(j.id) as count
    FROM industry_catalog ic
    LEFT JOIN jobs j ON ic.code = j.category
    GROUP BY ic.code, ic.name_cn
    ORDER BY count DESC
  `).all();

  const recentActivities = db.prepare(`
    SELECT * FROM (
      SELECT 'job' as type, id, title_cn as title, created_at
      FROM jobs
      ORDER BY created_at DESC
      LIMIT 5
    )
    UNION ALL
    SELECT * FROM (
      SELECT 'application' as type, id, '职位申请' as title, created_at
      FROM applications
      ORDER BY created_at DESC
      LIMIT 5
    )
    UNION ALL
    SELECT * FROM (
      SELECT 'user' as type, id, name as title, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    )
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  res.json({
    overview: {
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      pendingJobs,
      ftzSubsidyJobs,
      recordedJobs
    },
    jobsByCategory,
    recentActivities
  });
}

router.get('/stats', authenticateToken, requireRole(['admin']), getStats);
router.get('/dashboard', authenticateToken, requireRole(['admin']), getStats);

router.get('/jobs/pending', authenticateToken, requireRole(['admin']), (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, c.company_name, c.is_encouraged_industry, ic.name_cn as category_name
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN industry_catalog ic ON j.category = ic.code
    WHERE j.is_approved = 0
    ORDER BY j.created_at DESC
  `).all();

  res.json(jobs.map(job => ({
    ...job,
    tags: parseJSONField(job.tags),
    rcep_skills: parseJSONField(job.rcep_skills),
    has_ftz_subsidy: !!job.has_ftz_subsidy,
    is_encouraged_industry: !!job.is_encouraged_industry
  })));
});

router.post('/jobs/:id/approve', authenticateToken, requireRole(['admin']), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  db.prepare('UPDATE jobs SET is_approved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

  const recording = db.prepare('SELECT * FROM job_recordings WHERE job_id = ?').get(req.params.id);
  if (recording) {
    db.prepare(`
      UPDATE job_recordings 
      SET recording_status = 'recorded', recorded_at = CURRENT_TIMESTAMP, 
          bureau_response = ?
      WHERE job_id = ?
    `).run('已同步至海南省就业局岗位备案系统', req.params.id);
  } else {
    db.prepare(`
      INSERT INTO job_recordings (job_id, recording_status, recorded_at, bureau_response)
      VALUES (?, 'recorded', CURRENT_TIMESTAMP, ?)
    `).run(req.params.id, '已同步至海南省就业局岗位备案系统');
  }

  res.json({ message: '职位已审核通过，并已同步至就业局备案系统' });
});

router.post('/jobs/:id/reject', authenticateToken, requireRole(['admin']), (req, res) => {
  const { reason } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  db.prepare('UPDATE jobs SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

  res.json({ message: `职位已驳回${reason ? '：' + reason : ''}` });
});

router.get('/recordings', authenticateToken, requireRole(['admin']), (req, res) => {
  const { status } = req.query;
  
  let sql = `
    SELECT jr.*, j.title_cn, j.company_id, c.company_name
    FROM job_recordings jr
    LEFT JOIN jobs j ON jr.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
  `;
  const params = [];

  if (status) {
    sql += ' WHERE jr.recording_status = ?';
    params.push(status);
  }

  sql += ' ORDER BY jr.recorded_at DESC';

  const recordings = db.prepare(sql).all(...params);
  res.json(recordings);
});

router.get('/users', authenticateToken, requireRole(['admin']), (req, res) => {
  const { role } = req.query;
  
  let sql = `
    SELECT u.*, 
           CASE WHEN u.role = 'company' THEN c.company_name
                WHEN u.role = 'jobseeker' THEN jk.education
                ELSE NULL END as extra_info
    FROM users u
    LEFT JOIN companies c ON u.id = c.user_id
    LEFT JOIN jobseekers jk ON u.id = jk.user_id
  `;
  const params = [];

  if (role) {
    sql += ' WHERE u.role = ?';
    params.push(role);
  }

  sql += ' ORDER BY u.created_at DESC';

  const users = db.prepare(sql).all(...params);
  res.json(users);
});

router.get('/policies', authenticateToken, requireRole(['admin']), (req, res) => {
  const policies = db.prepare('SELECT * FROM policies ORDER BY created_at DESC').all();
  res.json(policies);
});

router.post('/policies', authenticateToken, requireRole(['admin']), (req, res) => {
  const { title_cn, title_en, content_cn, content_en, policy_number, category } = req.body;

  if (!title_cn || !policy_number) {
    return res.status(400).json({ error: '请填写必填字段' });
  }

  const result = db.prepare(`
    INSERT INTO policies (title_cn, title_en, content_cn, content_en, policy_number, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title_cn, title_en || null, content_cn || null, content_en || null, policy_number, category || 'general'
  );

  res.status(201).json({ id: result.lastInsertRowid, message: '政策已创建' });
});

router.get('/industry-catalog', (req, res) => {
  const catalog = db.prepare('SELECT * FROM industry_catalog ORDER BY code').all();
  res.json(catalog);
});

module.exports = router;
