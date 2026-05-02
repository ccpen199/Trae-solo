require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initializeDatabase } = require('./config/database');

const authRoutes = require('./routes/auth');
const organizationRoutes = require('./routes/organization');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const roleRoutes = require('./routes/roles');

const app = express();
const PORT = process.env.PORT || 9166;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9167';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: '登录尝试次数过多，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/mfa/verify', loginLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'IAM Service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/roles', roleRoutes);

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: '请求体格式错误'
    });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

const startServer = async () => {
  try {
    console.log('[IAM System] 正在初始化数据库...');
    await initializeDatabase();
    console.log('[IAM System] 数据库初始化完成');

    app.listen(PORT, () => {
      console.log('');
      console.log('============================================');
      console.log('  企业安全中台 IAM 系统');
      console.log('============================================');
      console.log(`  后端服务地址: http://localhost:${PORT}`);
      console.log(`  前端地址: ${FRONTEND_URL}`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  数据库: SQLite (${process.env.DB_PATH || './data/app.sqlite'})`);
      console.log('============================================');
      console.log('');
      console.log('  默认测试账号:');
      console.log('  - 管理员: admin / Admin@123456');
      console.log('  - 员工: employee / Employee@123');
      console.log('  - 审计员: auditor / Auditor@123');
      console.log('');
      console.log('  接口说明:');
      console.log('  - GET  /api/health               - 健康检查');
      console.log('  - POST /api/auth/login           - 用户登录');
      console.log('  - POST /api/auth/mfa/verify     - MFA验证');
      console.log('  - GET  /api/auth/me              - 获取当前用户');
      console.log('  - POST /api/auth/logout          - 登出');
      console.log('  - GET  /api/organizations        - 组织架构');
      console.log('  - GET  /api/users                - 用户列表');
      console.log('  - GET  /api/audit/logs           - 审计日志');
      console.log('  - GET  /api/audit/snapshot       - 实时监控快照');
      console.log('');
    });
  } catch (error) {
    console.error('[IAM System] 启动失败:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', () => {
  console.log('[IAM System] 收到 SIGTERM 信号，正在关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[IAM System] 收到 SIGINT 信号，正在关闭...');
  process.exit(0);
});
