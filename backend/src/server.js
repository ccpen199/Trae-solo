require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { initTables, migrateUserRoleConstraint } = require('./models/db');
const { seedData } = require('./data/seed');

const authRoutes = require('./routes/auth');
const parcelRoutes = require('./routes/parcels');
const pickupRoutes = require('./routes/pickup');
const shippingRoutes = require('./routes/shipping');
const communityRoutes = require('./routes/community');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 56793;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' }
});

app.use(cors({
  origin: 'http://127.0.0.1:46793',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed / 1024 / 1024
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

async function startServer() {
  try {
    console.log('正在初始化数据库...');
    initTables();
    console.log('数据库表初始化完成');

    console.log('正在检查数据库迁移...');
    migrateUserRoleConstraint();

    await seedData();

    app.listen(PORT, '127.0.0.1', () => {
      console.log('');
      console.log('========================================');
      console.log('🚀 物流管理后端服务已启动');
      console.log('📍 监听地址: http://127.0.0.1:' + PORT);
      console.log('🔗 API 前缀: http://127.0.0.1:' + PORT + '/api');
      console.log('💚 健康检查: http://127.0.0.1:' + PORT + '/api/health');
      console.log('========================================');
      console.log('');
      console.log('测试账号:');
      console.log('  平台管理员: platform / 123456');
      console.log('  运营管理员: ops / 123456');
      console.log('  系统管理员: admin / 123456');
      console.log('  驿站站长: stationmaster / 123456');
      console.log('  普通用户: zhangsan / 123456');
      console.log('  普通用户: lisi / 123456');
      console.log('');
    });
  } catch (err) {
    console.error('启动服务失败:', err);
    process.exit(1);
  }
}

startServer();
