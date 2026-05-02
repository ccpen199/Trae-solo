require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const PORT = process.env.PORT || 11621;
const DB_PATH = process.env.DB_PATH || './data/app.sqlite';
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

console.log('======================================');
console.log('项目协作管理系统 - 后端服务启动中...');
console.log('======================================');
console.log(`端口: ${PORT}`);
console.log(`数据库: ${DB_PATH}`);
console.log('======================================');

const uploadDir = path.resolve(__dirname, '..', UPLOAD_PATH);
const dataDir = path.resolve(__dirname, '..', path.dirname(DB_PATH));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = initDatabase(path.resolve(__dirname, '..', DB_PATH));

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: [
    'http://localhost:11622',
    'http://127.0.0.1:11622'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes(db));
app.use('/api/projects', projectRoutes(db));
app.use('/api/tasks', taskRoutes(db));
app.use('/api/dashboard', dashboardRoutes(db));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('======================================');
  console.log('后端服务启动成功!');
  console.log('======================================');
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`API地址:  http://localhost:${PORT}/api`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log('======================================');
  console.log('预设用户账号 (密码均为: 123456):');
  console.log('  - 项目经理: pm1 (张经理)');
  console.log('  - 开发成员: dev1 (李开发), dev2 (王开发)');
  console.log('  - 测试人员: tester1 (赵测试)');
  console.log('  - 客户代表: customer1 (钱客户)');
  console.log('  - 管理层:   manager1 (孙总监)');
  console.log('======================================');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database connection...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing database connection...');
  db.close();
  process.exit(0);
});

module.exports = app;
