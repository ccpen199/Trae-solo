require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 11321;

require('./models/database');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:11322',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const indexRoutes = require('./routes/index');
const orderRoutes = require('./routes/orders');

app.use('/api', indexRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '停车场管理系统后端服务运行正常',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  停车场管理系统 - 后端服务');
  console.log('========================================');
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`前端地址: ${process.env.FRONTEND_URL || 'http://localhost:11322'}`);
  console.log('========================================');
  console.log('默认账号:');
  console.log('  管理员: admin / admin123');
  console.log('  车主: owner / admin123');
  console.log('  收费员: toll / admin123');
  console.log('  场地方: operator / admin123');
  console.log('  财务: finance / admin123');
  console.log('========================================');
});

module.exports = app;