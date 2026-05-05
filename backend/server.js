require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

require('./database');

const app = express();
const PORT = process.env.PORT || 22177;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:21771';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'user-management-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'User Management API is running',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  用户管理系统 - 后端服务已启动');
  console.log('========================================');
  console.log(`  服务端口: ${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  API地址: http://localhost:${PORT}/api/`);
  console.log('========================================');
  console.log('  默认测试账号:');
  console.log('  管理员: admin / admin123');
  console.log('  普通用户: user / user123');
  console.log('========================================');
});
