require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.BACKEND_PORT || 53266;
const HOST = '127.0.0.1';

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:43266',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const accessLogStream = fs.createWriteStream(path.join(__dirname, '../backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'pet-service-platform',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'pet-service-platform-api'
  });
});

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const serviceRoutes = require('./routes/services');
const appointmentRoutes = require('./routes/appointments');
const transportRoutes = require('./routes/transport');
const recordRoutes = require('./routes/records');
const feeRoutes = require('./routes/fees');
const reviewRoutes = require('./routes/reviews');
const complaintRoutes = require('./routes/complaints');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api', (req, res) => {
  res.json({
    name: '宠物服务预约平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      pets: '/api/pets',
      services: '/api/services',
      appointments: '/api/appointments',
      transport: '/api/transport',
      records: '/api/records',
      fees: '/api/fees',
      reviews: '/api/reviews',
      complaints: '/api/complaints',
      stats: '/api/stats'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  const statusCode = err.statusCode || err.status || 500;
  const errorMessage = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.path,
    method: req.method
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`🚀 宠物服务预约平台后端已启动`);
  console.log(`📍 监听地址: http://${HOST}:${PORT}`);
  console.log(`🔗 API 地址: http://${HOST}:${PORT}/api`);
  console.log(`💊 健康检查: http://${HOST}:${PORT}/health`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`========================================\n`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
