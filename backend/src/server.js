require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 21277;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 11277;

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const corsOptions = {
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://0.0.0.0:${FRONTEND_PORT}`,
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const { initDb } = require('./db');

const userRoutes = require('./routes/user');
const questionRoutes = require('./routes/question');
const answerRoutes = require('./routes/answer');
const articleRoutes = require('./routes/article');
const commentRoutes = require('./routes/comment');
const followRoutes = require('./routes/follow');
const favoriteRoutes = require('./routes/favorite');
const messageRoutes = require('./routes/message');
const categoryRoutes = require('./routes/category');
const activityRoutes = require('./routes/activity');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PMcaff 后端服务运行中',
    timestamp: Date.now(),
    port: PORT
  });
});

app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    code: 500
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    code: 404
  });
});

async function startServer() {
  try {
    await initDb();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  PMcaff 后端服务已启动');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`  前端地址: http://localhost:${FRONTEND_PORT}`);
      console.log(`  数据库: ${path.resolve(__dirname, '../../data/app.sqlite')}`);
      console.log('========================================');
      console.log('  默认管理员账号:');
      console.log(`  邮箱: ${process.env.ADMIN_EMAIL || 'admin@pmcaff.com'}`);
      console.log(`  密码: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，正在优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT，正在优雅关闭...');
  process.exit(0);
});
