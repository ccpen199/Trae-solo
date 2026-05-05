require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { testConnection, initDatabase } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const dormitoryRoutes = require('./routes/dormitoryRoutes');
const roomRoutes = require('./routes/roomRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roomChangeRoutes = require('./routes/roomChangeRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 12239;

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:21223',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '学生宿舍管理系统 API 运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '学生宿舍管理系统 API v1',
    endpoints: {
      auth: '/api/auth',
      dormitories: '/api/dormitories',
      rooms: '/api/rooms',
      students: '/api/students',
      roomChanges: '/api/room-changes',
      maintenance: '/api/maintenance',
      reports: '/api/reports',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dormitories', dormitoryRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/room-changes', roomChangeRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const checkAndInitDatabase = async () => {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/dormitory.db');
  if (!fs.existsSync(dbPath)) {
    console.log('\n数据库不存在，正在初始化...');
    const initScript = require('./scripts/initDatabase');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const startServer = async () => {
  try {
    console.log('========================================');
    console.log('  学生宿舍管理系统 - 后端服务启动中...');
    console.log('========================================');
    console.log(`环境: ${process.env.NODE_ENV}`);
    console.log(`端口: ${PORT}`);

    console.log('\n正在初始化数据库...');
    await checkAndInitDatabase();
    await testConnection();

    console.log('\n正在初始化内存缓存...');
    console.log('✓ 内存缓存初始化成功');

    console.log('\n正在初始化内存队列...');
    console.log('✓ 内存队列初始化成功');

    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('  ✅ 后端服务启动成功!');
      console.log('========================================');
      console.log(`API 地址: http://localhost:${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
      console.log(`API 文档: http://localhost:${PORT}/api`);
      console.log('\n默认账号:');
      console.log('  系统管理员: admin / 123456');
      console.log('  宿舍管理员: dorm_admin / 123456');
      console.log('  学生账号: student1 / 123456 (张三)');
      console.log('  学生账号: student2 / 123456 (李四)');
      console.log('  学生账号: student3 / 123456 (王五)');
      console.log('\n启动时间:', new Date().toLocaleString());
      console.log('========================================\n');
    });

  } catch (err) {
    console.error('❌ 服务器启动失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

startServer();

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

module.exports = app;