require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase, db } = require('./database');
const { authenticateToken, requireRole } = require('./middleware');

const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const policiesRoutes = require('./routes/policies');
const jobseekersRoutes = require('./routes/jobseekers');
const contractsRoutes = require('./routes/contracts');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59068');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '49068');

app.use(cors({
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '海南自贸港特色岗位撮合平台 - 后端API',
    version: '1.0.0'
  });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const jobs = db.prepare(`
    SELECT j.*, c.company_name, c.is_encouraged_industry, ic.name_cn as category_name, ic.name_en as category_name_en
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN industry_catalog ic ON j.category = ic.code
    WHERE j.is_active = 1
      AND j.is_approved = 1
      AND (? = '' OR j.title_cn LIKE ? OR j.title_en LIKE ? OR j.description_cn LIKE ? OR j.tags LIKE ? OR j.rcep_skills LIKE ? OR c.company_name LIKE ?)
    ORDER BY j.created_at DESC
    LIMIT 20
  `).all(keyword, like, like, like, like, like, like);

  res.json({
    keyword,
    total: jobs.length,
    jobs,
  });
});

app.get(['/api/user/profile', '/api/users/profile'], (req, res) => {
  const user = db.prepare('SELECT id, email, role, name, phone FROM users WHERE role = ? ORDER BY id LIMIT 1').get('admin');
  res.json({
    user,
    profile: user,
  });
});

function readAdminStats() {
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

  return {
    overview: {
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      pendingJobs,
      ftzSubsidyJobs,
      recordedJobs
    },
    jobsByCategory
  };
}

app.get(['/api/admin/stats', '/api/admin/dashboard'], (req, res) => {
  res.json(readAdminStats());
});

app.get('/api/company/stats', authenticateToken, requireRole(['company', 'admin']), (req, res) => {
  const companyId = req.user.role === 'company'
    ? db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id)?.id
    : null;
  if (req.user.role === 'company' && !companyId) {
    return res.status(404).json({ error: '未找到企业信息' });
  }
  const scopeWhere = companyId ? 'WHERE company_id = ?' : '';
  const scopeParams = companyId ? [companyId] : [];
  const totalJobs = db.prepare(`SELECT COUNT(*) as count FROM jobs ${scopeWhere}`).get(...scopeParams).count;
  const approvedJobs = db.prepare(`SELECT COUNT(*) as count FROM jobs ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} is_approved = 1`).get(...scopeParams).count;
  const pendingJobs = db.prepare(`SELECT COUNT(*) as count FROM jobs ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} is_approved = 0`).get(...scopeParams).count;
  const recordedJobs = db.prepare(`
    SELECT COUNT(*) as count
    FROM job_recordings jr
    INNER JOIN jobs j ON jr.job_id = j.id
    ${companyId ? 'WHERE j.company_id = ? AND' : 'WHERE'} jr.recording_status = 'recorded'
  `).get(...scopeParams).count;
  const applications = db.prepare(`
    SELECT COUNT(*) as count
    FROM applications a
    INNER JOIN jobs j ON a.job_id = j.id
    ${companyId ? 'WHERE j.company_id = ?' : ''}
  `).get(...scopeParams).count;

  res.json({
    totalJobs,
    approvedJobs,
    pendingJobs,
    recordedJobs,
    applications,
    recordingRate: totalJobs ? Math.round((recordedJobs / totalJobs) * 100) : 0,
  });
});

app.post('/api/company/sync-filing', authenticateToken, requireRole(['company', 'admin']), (req, res) => {
  const companyId = req.user.role === 'company'
    ? db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id)?.id
    : null;
  if (req.user.role === 'company' && !companyId) {
    return res.status(404).json({ error: '未找到企业信息' });
  }
  const pending = db.prepare(`
    SELECT jr.id
    FROM job_recordings jr
    INNER JOIN jobs j ON jr.job_id = j.id
    WHERE jr.recording_status != 'recorded'
      ${companyId ? 'AND j.company_id = ?' : ''}
    ORDER BY jr.id
    LIMIT 1
  `).get(...(companyId ? [companyId] : []));

  if (pending) {
    db.prepare(`
      UPDATE job_recordings
      SET recording_status = 'recorded',
          recorded_at = CURRENT_TIMESTAMP,
          bureau_response = '已同步至海南省就业局岗位备案系统'
      WHERE id = ?
    `).run(pending.id);
  }

  res.json({
    synced: !!pending,
    message: pending ? '备案同步完成' : '暂无待同步备案',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/jobseekers', jobseekersRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'API 接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 海南自贸港特色岗位撮合平台后端服务已启动`);
  console.log(`📍 服务地址: http://127.0.0.1:${PORT}`);
  console.log(`📡 API 健康检查: http://127.0.0.1:${PORT}/api/health`);
  console.log(`💾 数据库: ${process.env.DB_PATH || './data/app.sqlite'}`);
  console.log(`⏱️  启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;
