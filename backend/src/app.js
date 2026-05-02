require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initData, db } = require('./database/memoryDb');

const ordersRouter = require('./routes/orders');
const exceptionsRouter = require('./routes/exceptions');
const messagesRouter = require('./routes/messages');
const poisRouter = require('./routes/pois');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 111230;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:111231';

const corsOptions = {
  origin: FRONTEND_URL,
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

app.get('/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    service: 'map-navigation-backend',
    version: '1.0.0'
  });
});

app.get('/api/constants', (req, res) => {
  const { ORDER_STATUSES, STATUS_DISPLAY_NAMES, ROLES, EXCEPTION_TYPES, EXCEPTION_SEVERITY } = require('./core/stateMachine');
  
  res.json({
    success: true,
    data: {
      orderStatuses: ORDER_STATUSES,
      statusDisplayNames: STATUS_DISPLAY_NAMES,
      roles: ROLES,
      exceptionTypes: EXCEPTION_TYPES,
      exceptionSeverity: EXCEPTION_SEVERITY
    }
  });
});

app.get('/api/users', (req, res) => {
  const users = db.users
    .filter(u => u.is_active === 1)
    .sort((a, b) => a.role.localeCompare(b.role));
  res.json({ success: true, data: users });
});

app.use('/api/orders', ordersRouter);
app.use('/api/exceptions', exceptionsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/pois', poisRouter);
app.use('/api/reports', reportsRouter);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

async function startServer() {
  try {
    console.log('初始化数据...');
    initData();
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  地图导航与路线规划系统 - 后端服务');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  前端地址: ${FRONTEND_URL}`);
      console.log('  数据库: 内存数据库 (演示模式)');
      console.log('========================================');
      console.log('  可用端点:');
      console.log('  - GET  /health');
      console.log('  - GET  /api/constants');
      console.log('  - GET  /api/users');
      console.log('  - GET  /api/orders');
      console.log('  - POST /api/orders');
      console.log('  - GET  /api/orders/:orderNo');
      console.log('  - GET  /api/exceptions');
      console.log('  - GET  /api/messages');
      console.log('  - GET  /api/pois');
      console.log('  - GET  /api/reports/*');
      console.log('========================================');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();
