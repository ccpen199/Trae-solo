require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { success, error } = require('./utils/response');
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const jobsRoutes = require('./routes/jobs');
const { router: candidatesRoutes } = require('./routes/candidates');
const applicationsRoutes = require('./routes/applications');
const interviewsRoutes = require('./routes/interviews');
const offersRoutes = require('./routes/offers');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.BACKEND_PORT || 59099;
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.FRONTEND_URL || 'http://127.0.0.1:49099';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json(success({ status: 'ok', timestamp: Date.now() }));
});

app.get(['/api/users/profile', '/api/user/profile'], (req, res) => {
  const user = db.prepare(`
    SELECT hu.id, hu.company_id, hu.email, hu.phone, hu.name, hu.avatar, hu.role, hu.department, hu.position, hu.status,
      c.name as company_name, c.logo as company_logo, c.verification_status, c.credit_score
    FROM hr_users hu
    LEFT JOIN companies c ON hu.company_id = c.id
    WHERE hu.email = 'hr@zhilian.com'
  `).get();
  res.json(success(user));
});

app.get('/api/search', (req, res) => {
  const keyword = `%${req.query.q || req.query.keyword || ''}%`;
  const jobs = db.prepare(`
    SELECT id, title, department, work_city, salary_min, salary_max, status
    FROM jobs
    WHERE title LIKE ? OR department LIKE ? OR work_city LIKE ?
    ORDER BY hot_score DESC
    LIMIT 10
  `).all(keyword, keyword, keyword);
  res.json(success({ list: jobs, total: jobs.length }));
});

app.get(['/api/admin/stats', '/api/admin/dashboard'], (req, res) => {
  const stats = {
    jobs: db.prepare('SELECT COUNT(*) AS count FROM jobs').get().count,
    candidates: db.prepare('SELECT COUNT(*) AS count FROM candidates').get().count,
    applications: db.prepare('SELECT COUNT(*) AS count FROM job_applications').get().count,
    interviews: db.prepare('SELECT COUNT(*) AS count FROM interviews').get().count
  };
  res.json(success(stats));
});

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => {
  res.status(404).json(error('API not found', 404));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json(error(err.message || 'Internal server error', 500));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

module.exports = app;
