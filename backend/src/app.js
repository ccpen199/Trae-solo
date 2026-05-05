require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const sequelize = require('./config/database');
const { createRedisClient } = require('./config/redis');

const authRoutes = require('./routes/auth');
const organizationRoutes = require('./routes/organization');
const roleRoutes = require('./routes/role');
const scheduleRoutes = require('./routes/schedule');

const app = express();
const PORT = process.env.PORT || 12228;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22281';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(morgan('combined'));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OA System API is running',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/schedules', scheduleRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 401,
      message: '未授权访问'
    });
  }

  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    try {
      createRedisClient();
      console.log('Redis连接初始化完成');
    } catch (redisErr) {
      console.log('Redis连接失败，使用内存存储模式');
    }

    app.listen(PORT, () => {
      console.log('========================================');
      console.log('OA System Backend 启动成功!');
      console.log('服务地址: http://localhost:' + PORT);
      console.log('API地址: http://localhost:' + PORT + '/api');
      console.log('前端地址: ' + FRONTEND_URL);
      console.log('========================================');
      console.log('默认登录账号:');
      console.log('管理员: admin / admin123');
      console.log('员工: zhangsan / 123456');
      console.log('========================================');
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭...');
  process.exit(0);
});

module.exports = app;
