require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { router: authRouter } = require('./src/routes/auth');
const ordersRouter = require('./src/routes/orders');
const reportsRouter = require('./src/routes/reports');
const messagesRouter = require('./src/routes/messages');
const geocodeRouter = require('./src/routes/geocode');

require('./src/database/init');

const app = express();
const PORT = process.env.PORT || 11131;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11132';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:11132', 'http://127.0.0.1:11132'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '地图导航与路线规划系统后端服务运行正常',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

app.get('/api/constants', (req, res) => {
  const {
    ORDER_STATUS,
    STATUS_NAMES,
    ROLE_NAMES,
    ROUTE_TYPES,
    ROUTE_TYPE_NAMES,
    EXCEPTION_TYPES,
    EXCEPTION_TYPE_NAMES,
    ACTION_TYPES,
    STATE_TRANSITIONS,
  } = require('./src/utils/constants');

  res.json({
    success: true,
    data: {
      ORDER_STATUS,
      STATUS_NAMES,
      ROLE_NAMES,
      ROUTE_TYPES,
      ROUTE_TYPE_NAMES,
      EXCEPTION_TYPES,
      EXCEPTION_TYPE_NAMES,
      ACTION_TYPES,
      STATE_TRANSITIONS,
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/geocode', geocodeRouter);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  地图导航与路线规划系统 - 后端服务');
  console.log('========================================');
  console.log(`服务端口: ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`前端地址: ${FRONTEND_URL}`);
  console.log(`启动时间: ${new Date().toISOString()}`);
  console.log('========================================');
  console.log('API 端点:');
  console.log('  GET  /api/health              - 健康检查');
  console.log('  GET  /api/constants           - 常量定义');
  console.log('  POST /api/auth/login          - 用户登录');
  console.log('  POST /api/auth/register       - 用户注册');
  console.log('  GET  /api/orders              - 订单列表');
  console.log('  POST /api/orders              - 创建订单');
  console.log('  GET  /api/reports/overview    - 统计概览');
  console.log('  GET  /api/messages            - 消息列表');
  console.log('========================================');
});

module.exports = app;
