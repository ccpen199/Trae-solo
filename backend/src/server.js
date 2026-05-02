require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDb } = require('./config/database');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const ruleRoutes = require('./routes/rules');
const alertRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');
const messageRoutes = require('./routes/messages');
const auditRoutes = require('./routes/audit');

const PORT = process.env.PORT || 11811;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11812';

const app = express();

const corsOptions = {
  origin: [FRONTEND_URL, 'http://localhost:11812', 'http://127.0.0.1:11812'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '监控告警平台后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/audit', auditRoutes);

app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const startServer = async () => {
  try {
    console.log('正在初始化数据库...');
    await initDb();
    console.log('数据库初始化完成');
    
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  监控告警平台后端服务启动成功!`);
      console.log(`========================================`);
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API 地址: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
      console.log(`  默认用户账号 (密码: 123456):`);
      console.log(`    - admin (管理员)`);
      console.log(`    - ops01 (运维工程师)`);
      console.log(`    - dev01 (开发工程师)`);
      console.log(`    - oncall01 (值班人员)`);
      console.log(`    - manager01 (管理者)`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
};

startServer();
