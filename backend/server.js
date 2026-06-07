require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 59045);
const PROJECT_DIR = process.env.PROJECT_DIR || __dirname;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49045}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    if (res.statusCode >= 500) {
      console.error(`服务器错误: ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
      if (typeof body === 'string' && body.includes('Error')) {
        console.error(body);
      }
    }
    originalSend.call(this, body);
  };
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    code: 200,
    data: {
      status: 'running',
      project: '山西省"互联网+人社"综合服务平台',
      timestamp: new Date().toISOString(),
      port: BACKEND_PORT
    }
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/qualification', require('./routes/qualification'));
app.use('/api/social-card', require('./routes/socialCard'));
app.use('/api/medical-payment', require('./routes/medicalPayment'));
app.use('/api/insurance', require('./routes/insuranceRecord'));
app.use('/api/hr', require('./routes/hrService'));
app.use('/api/fund', require('./routes/fundMonitor'));
app.use('/api/offline', require('./routes/offlineSync'));
app.use('/api/admin', require('./routes/admin'));

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.json({
    success: false,
    code: 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: '接口不存在',
    data: null
  });
});

const server = app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log('\n========================================');
  console.log('山西省"互联网+人社"综合服务平台 - 后端API');
  console.log(`服务地址: http://127.0.0.1:${BACKEND_PORT}`);
  console.log(`健康检查: http://127.0.0.1:${BACKEND_PORT}/api/health`);
  console.log(`启动时间: ${new Date().toLocaleString()}`);
  console.log(`项目目录: ${PROJECT_DIR}`);
  console.log('========================================\n');
});

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务...');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，正在关闭服务...');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

module.exports = server;
