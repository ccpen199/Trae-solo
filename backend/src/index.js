require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { initRedis } = require('./config/redis');
const initAllData = require('./config/initData');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const boardRoutes = require('./routes/boards');
const topicRoutes = require('./routes/topics');
const replyRoutes = require('./routes/replies');
const moderatorRoutes = require('./routes/moderator');

const app = express();
const PORT = process.env.PORT || 12175;

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:22175', 'http://127.0.0.1:22175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(authMiddleware);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Forum API is running',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.role?.name
    } : null
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/replies', replyRoutes);
app.use('/api/moderator', moderatorRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

async function startServer() {
  try {
    console.log('正在初始化 Redis...');
    await initRedis();

    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功!');

    console.log('正在同步数据库模型...');
    try {
      await sequelize.sync({ alter: false, force: false });
      console.log('数据库模型同步完成!');
    } catch (syncError) {
      console.warn('模型同步警告（表已存在）:', syncError.message);
    }

    console.log('正在初始化数据...');
    await initAllData();

    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('论坛后端服务已启动!');
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log(`API 地址: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
      console.log('默认账户:');
      console.log('  管理员: admin / admin123');
      console.log('  测试用户: testuser / 123456');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    console.log('\n尝试使用模拟数据模式启动...');
    
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('论坛后端服务已启动 (模拟数据模式)');
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log('='.repeat(60));
      console.log('注意: 数据库连接失败，部分功能可能不可用');
      console.log('请确保 PostgreSQL 服务已启动并创建数据库: forum_db');
      console.log('='.repeat(60));
    });
  }
}

startServer();
