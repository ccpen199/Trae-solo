require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');

const authRoutes = require('./routes/auth');
const volunteerRoutes = require('./routes/volunteers');
const activityRoutes = require('./routes/activities');
const orgRoutes = require('./routes/organizations');
const yicoinRoutes = require('./routes/yicoins');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58998;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48998}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/yicoins', yicoinRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ 
      success: true, 
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: '志愿公益数字化基础设施平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      volunteers: '/api/volunteers',
      activities: '/api/activities',
      organizations: '/api/organizations',
      yicoins: '/api/yicoins',
      posts: '/api/posts',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 志愿公益平台后端服务已启动`);
  console.log(`📍 地址: http://127.0.0.1:${PORT}`);
  console.log(`📊 健康检查: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📚 API 文档: http://127.0.0.1:${PORT}/api`);
});

module.exports = app;
