require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { initDatabase } = require('./models/initDb');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const archiveRoutes = require('./routes/archive');

const app = express();
const PORT = process.env.PORT || 11812;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:21812';

app.use(helmet());
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:21812'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      port: PORT
    }
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      apiVersion: '1.0.0',
      authRequired: true,
      roles: ['consumer', 'designer', 'operator', 'sales']
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/archive', archiveRoutes);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

async function startServer() {
  try {
    console.log('正在初始化数据库...');
    await initDatabase();
    console.log('数据库初始化完成');

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  3D产品展示系统后端服务已启动`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  前端地址: ${FRONTEND_URL}`);
      console.log(`========================================`);
      console.log(`  默认用户账号 (密码: 123456):`);
      console.log(`  - consumer1 (消费者)`);
      console.log(`  - designer1 (设计师)`);
      console.log(`  - operator1 (运营)`);
      console.log(`  - sales1 (销售)`);
      console.log(`========================================`);
    });
  } catch (err) {
    console.error('启动服务器失败:', err);
    process.exit(1);
  }
}

startServer();
