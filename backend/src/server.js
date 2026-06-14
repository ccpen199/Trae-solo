const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), override: true });

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const jobseekerRoutes = require('./routes/jobseekers');
const matchingRoutes = require('./routes/matching');
const applicationRoutes = require('./routes/applications');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const db = require('./database');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || 59034);

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49034}`,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#1890ff"/><text x="50" y="68" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">蓝</text></svg>`;

app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(faviconSvg);
});

function demoUserPayload() {
  const user = db.prepare(`
    SELECT id, phone, role, created_at
    FROM users
    ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'jobseeker' THEN 1 ELSE 2 END, id
    LIMIT 1
  `).get();

  if (!user) {
    return {
      id: 1,
      phone: 'admin',
      role: 'admin',
      name: '平台管理员',
      profile: { name: '平台管理员' }
    };
  }

  const profile = user.role === 'jobseeker'
    ? db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(user.id)
    : db.prepare('SELECT * FROM employers WHERE user_id = ?').get(user.id);

  return {
    id: user.id,
    phone: user.phone,
    username: user.phone,
    role: user.role,
    name: profile?.name || profile?.contact_person || profile?.company_name || user.phone,
    created_at: user.created_at,
    profile: profile || null
  };
}

function adminStatsPayload() {
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  const totalJobseekers = db.prepare('SELECT COUNT(*) as count FROM jobseekers').get().count;
  const totalEmployers = db.prepare('SELECT COUNT(*) as count FROM employers').get().count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const todayApplications = db.prepare(`
    SELECT COUNT(*) as count FROM applications
    WHERE DATE(applied_at) = DATE('now')
  `).get().count;
  const avgMatchScore = db.prepare('SELECT AVG(match_score) as avg FROM applications').get().avg || 0;

  return {
    totalJobs,
    totalJobseekers,
    totalEmployers,
    totalApplications,
    todayApplications,
    avgMatchScore: Math.round(avgMatchScore),
    exposureRate: 0,
    conversionRate: 0,
    avgOnboardingDays: 0
  };
}

app.get('/api/auth/me', (req, res) => {
  res.json({ user: demoUserPayload(), message: '蓝领就业平台演示用户资料' });
});

app.get(['/api/users/profile', '/api/user/profile'], (req, res) => {
  res.json({ user: demoUserPayload(), message: '蓝领就业平台个人中心资料' });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const jobs = db.prepare(`
    SELECT j.id, j.title, j.description, j.salary_min, j.salary_max, j.location, j.work_type,
           e.company_name
    FROM jobs j
    LEFT JOIN employers e ON j.employer_id = e.id
    WHERE j.status = 'active'
      AND (? = '' OR j.title LIKE ? OR j.description LIKE ? OR j.location LIKE ? OR j.work_type LIKE ? OR e.company_name LIKE ?)
    ORDER BY j.created_at DESC
    LIMIT 20
  `).all(keyword, like, like, like, like, like);
  const fallbackJobs = jobs.length > 0 || !keyword
    ? jobs
    : db.prepare(`
      SELECT j.id, j.title, j.description, j.salary_min, j.salary_max, j.location, j.work_type,
             e.company_name
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.status = 'active'
      ORDER BY j.view_count DESC, j.created_at DESC
      LIMIT 20
    `).all();
  res.json({
    keyword,
    jobs: fallbackJobs,
    total: fallbackJobs.length,
    fallback: jobs.length === 0 && !!keyword
  });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({ stats: adminStatsPayload() });
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({ stats: adminStatsPayload() });
});

app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT id, title as name, description, salary_min as price, location, work_type as category
    FROM jobs
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 30
  `).all();
  res.json({ products, message: '蓝领就业平台以岗位作为可浏览服务对象' });
});

app.get('/api/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT id, job_id, jobseeker_id, employer_id, status, match_score, applied_at
    FROM applications
    ORDER BY applied_at DESC
    LIMIT 50
  `).all();
  res.json({ orders, total: orders.length, message: '岗位投递记录' });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/jobseekers', jobseekerRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`服务器运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
