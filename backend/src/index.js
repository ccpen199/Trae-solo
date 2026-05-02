require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');
const priceIndex = require('./engines/PriceIndex');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/user');
const commonRoutes = require('./routes/common');

const app = express();
const PORT = parseInt(process.env.PORT) || 11101;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11102';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:11102'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/common', commonRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      port: PORT
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '垃圾分类回收平台 API',
    data: {
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        orders: '/api/orders',
        user: '/api/user',
        common: '/api/common'
      }
    }
  });
});

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

async function initializeSystem() {
  try {
    console.log('正在初始化系统...');
    await priceIndex.initializeDefaultRules();
    console.log('价格规则初始化完成');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log('  垃圾分类回收平台 后端服务');
      console.log('========================================');
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log(`API 地址: http://localhost:${PORT}/api`);
      console.log(`前端地址: ${FRONTEND_URL}`);
      console.log(`数据库: ${process.env.DB_PATH || './data/app.sqlite'}`);
      console.log('========================================');
      console.log('服务已启动，按 Ctrl+C 停止服务');
    });
  } catch (error) {
    console.error('系统初始化失败:', error);
    process.exit(1);
  }
}

initializeSystem();
