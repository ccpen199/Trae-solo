require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, db } = require('./models/database');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const videoRoutes = require('./routes/videoRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { getCampusEvents, createCampusEvent, getCampusStats } = require('./controllers/campusController');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58939;
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT) || 48939;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

initDatabase();

function initAdminUser() {
  const bcrypt = require('bcryptjs');
  const adminEmail = 'admin@videocareer.com';
  
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)')
      .run('admin', adminEmail, hashedPassword, 'admin');
    console.log('Admin user created: admin@videocareer.com / admin123');
  }
}

initAdminUser();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  try {
    const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_active = 1').get().count;
    const totalJobseekers = db.prepare('SELECT COUNT(*) as count FROM jobseekers').get().count;
    const totalHired = db.prepare('SELECT COUNT(*) as count FROM applications WHERE status = ?').get('hired').count;
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const totalVideos = db.prepare('SELECT COUNT(*) as count FROM videos WHERE status = ?').get('approved').count;
    const pendingVideos = db.prepare('SELECT COUNT(*) as count FROM videos WHERE status = ?').get('pending').count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      companies: totalCompanies,
      jobs: totalJobs,
      jobseekers: totalJobseekers,
      hired: totalHired,
      applications: totalApplications,
      videos: totalVideos,
      pendingVideos: pendingVideos,
      totalUsers: totalUsers
    });
  } catch (err) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/campus/events', getCampusEvents);
app.post('/api/campus/events', createCampusEvent);
app.get('/api/campus/stats', getCampusStats);

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           视频驱动职场连接平台 - 后端服务                    ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://127.0.0.1:${PORT}                          ║
║  健康检查: http://127.0.0.1:${PORT}/api/health                ║
║  数据库: SQLite (data/app.sqlite)                           ║
║  管理员账号: admin@videocareer.com / admin123               ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
