const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
const { db, initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 59018;

app.use(cors({
  origin: ['http://127.0.0.1:49018', 'http://localhost:49018'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const demoUser = {
  userId: 1,
  role: 'admin',
  name: '演示管理员',
  phone: 'admin',
  real_name_verified: 1,
  profile: { is_admin: true, permissions: 'all' }
};

app.get('/api/auth/me', (req, res) => {
  res.json(demoUser);
});

app.get('/api/users/profile', (req, res) => {
  res.json(demoUser);
});

app.get('/api/user/profile', (req, res) => {
  res.json(demoUser);
});

app.get('/api/profile', (req, res) => {
  res.json(demoUser);
});

app.get('/api/search', (req, res) => {
  const keyword = `%${String(req.query.q || req.query.keyword || '').trim()}%`;
  const jobs = db.prepare(`
    SELECT jp.*, c.company_name
    FROM job_posts jp
    JOIN companies c ON jp.company_id = c.id
    WHERE jp.status = 'open'
      AND (? = '%%' OR jp.title LIKE ? OR jp.skill_required LIKE ? OR jp.location LIKE ? OR jp.description LIKE ?)
    ORDER BY jp.created_at DESC
    LIMIT 20
  `).all(keyword, keyword, keyword, keyword, keyword);
  res.json({ jobs, total: jobs.length });
});

function adminSummary() {
  const totalWorkers = db.prepare('SELECT COUNT(*) as count FROM workers').get().count;
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  const totalTeams = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM job_posts').get().count;
  const openJobs = db.prepare("SELECT COUNT(*) as count FROM job_posts WHERE status = 'open'").get().count;
  const totalMatches = db.prepare('SELECT COUNT(*) as count FROM job_matches').get().count;
  const todayAttendances = db.prepare("SELECT COUNT(*) as count FROM attendances WHERE DATE(created_at) = DATE('now')").get().count;

  const skillStats = db.prepare(`
    SELECT skill_required as skill, COUNT(*) as count
    FROM job_posts
    WHERE status = 'open'
    GROUP BY skill_required
    ORDER BY count DESC
    LIMIT 10
  `).all();

  const regionStats = db.prepare(`
    SELECT location, COUNT(*) as count, AVG(daily_salary) as avg_salary
    FROM job_posts
    WHERE status = 'open'
    GROUP BY location
    ORDER BY count DESC
    LIMIT 10
  `).all();

  const recentJobs = db.prepare(`
    SELECT jp.*, c.company_name
    FROM job_posts jp
    JOIN companies c ON jp.company_id = c.id
    ORDER BY jp.created_at DESC
    LIMIT 10
  `).all();

  return {
    overview: { totalWorkers, totalCompanies, totalTeams, totalJobs, openJobs, totalMatches, todayAttendances },
    skillStats,
    regionStats,
    recentJobs
  };
}

app.get('/api/admin/stats', (req, res) => {
  res.json(adminSummary());
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json(adminSummary());
});

app.get('/api/products', (req, res) => {
  const pageSize = parseInt(req.query.limit || req.query.pageSize || '12', 10);
  const jobs = db.prepare(`
    SELECT jp.id, jp.title as name, jp.skill_required as category, jp.description,
           jp.daily_salary as price, jp.location, c.company_name
    FROM job_posts jp
    JOIN companies c ON jp.company_id = c.id
    WHERE jp.status = 'open'
    ORDER BY jp.created_at DESC
    LIMIT ?
  `).all(pageSize);
  res.json({ products: jobs, total: jobs.length });
});

function jobApplications() {
  const matches = db.prepare(`
    SELECT jm.*, jp.title as job_title, jp.daily_salary, c.company_name
    FROM job_matches jm
    JOIN job_posts jp ON jm.job_id = jp.id
    JOIN companies c ON jp.company_id = c.id
    ORDER BY jm.created_at DESC
    LIMIT 20
  `).all();
  return matches;
}

app.get('/api/orders', (req, res) => {
  const matches = jobApplications();
  res.json({ orders: matches, total: matches.length });
});

app.get('/api/applications', (req, res) => {
  const matches = jobApplications();
  res.json({ applications: matches, orders: matches, total: matches.length });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '建筑用工撮合平台采用岗位申请流程，无购物车' });
});

app.use('/api/auth', authRoutes.router);
app.use('/api/jobs', jobRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});
