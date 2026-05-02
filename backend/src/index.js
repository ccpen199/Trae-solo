const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const planRoutes = require('./routes/plans');
const subscriptionRoutes = require('./routes/subscriptions');
const invoiceRoutes = require('./routes/invoices');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const auditRoutes = require('./routes/audit');

const PORT = parseInt(process.env.BACKEND_PORT || 9174);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || 9175);
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

const app = express();

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(cors({
  origin: [FRONTEND_URL, `http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  const { closeDatabase } = require('./database');
  closeDatabase();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  const { closeDatabase } = require('./database');
  closeDatabase();
  process.exit(0);
});

const server = app.listen(PORT, () => {
  logger.info(`========================================`);
  logger.info(`订阅计费系统后端服务已启动`);
  logger.info(`========================================`);
  logger.info(`服务地址: http://localhost:${PORT}`);
  logger.info(`API 地址: http://localhost:${PORT}/api`);
  logger.info(`健康检查: http://localhost:${PORT}/api/health`);
  logger.info(`========================================`);
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});

module.exports = { app, server };
