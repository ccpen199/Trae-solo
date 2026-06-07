const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { db, initDatabase } = require('./utils/database');
const { seedData } = require('./utils/seed');

const authRoutes = require('./routes/auth');
const meterReadingRoutes = require('./routes/meterReading');
const billingRoutes = require('./routes/billing');
const workOrderRoutes = require('./routes/workOrder');
const productRoutes = require('./routes/product');
const safetyRoutes = require('./routes/safety');
const adminRoutes = require('./routes/admin');
const { authenticateToken } = require('./middleware/auth');
const { getServiceUserId } = require('./utils/accountContext');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 59076;
const HOST = '127.0.0.1';

function checkPort() {
  const slots = [40000, 41000, 42000, 43000, 44000, 45000];
  const slot = parseInt(process.env.PORT_SLOT) || 0;
  const projectName = path.basename(path.join(__dirname, '../..'));
  const N = parseInt(projectName.replace(/[^0-9]/g, '')) || 0;
  const tail4 = N % 10000;
  const expectedPort = 50000 + tail4 + slot * 10000;
  
  if (PORT !== expectedPort) {
    console.error(`端口配置错误: 配置端口 ${PORT}, 期望端口 ${expectedPort}`);
  }
}

initDatabase();
seedData();
checkPort();

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 49076}`, `http://localhost:${process.env.FRONTEND_PORT || 49076}`],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'gas-smart-service-backend'
  });
});

app.use('/api/auth', authRoutes);
app.get(['/api/users/profile', '/api/user/profile'], authenticateToken, (req, res) => {
  try {
    const serviceUserId = getServiceUserId(req);
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(serviceUserId);
    const meter = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(serviceUserId);
    res.json({ profile, meter, service_user_id: serviceUserId });
  } catch (err) {
    res.status(500).json({ error: '获取用户资料失败' });
  }
});
app.use('/api/meter-reading', meterReadingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/work-order', workOrderRoutes);
app.use('/api/product', productRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API路由不存在' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`燃气智能服务平台 - 后端服务`);
  console.log(`========================================`);
  console.log(`监听地址: http://${HOST}:${PORT}`);
  console.log(`健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`API 前缀: /api`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请检查或使用备用端口槽位`);
    process.exit(1);
  }
  console.error('服务器启动失败:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
