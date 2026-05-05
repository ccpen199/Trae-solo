const express = require('express');
const cors = require('cors');
require('dotenv').config();

const store = require('./config/memoryStore');
const { initRedis } = require('./config/redis');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const householdRoutes = require('./routes/householdRoutes');

const app = express();
const PORT = process.env.PORT || 12241;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:12242',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '户籍管理系统服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: '内存存储'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/households', householdRoutes);

app.use((err, req, res, next) => {
  console.error('全局错误处理:', err);
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

const startServer = async () => {
  try {
    console.log('正在初始化服务...');

    await store.initDefaultData();
    console.log('默认数据初始化完成');

    try {
      await initRedis();
    } catch (redisError) {
      console.log('Redis 不可用，使用内存缓存降级方案');
    }

    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  户籍管理系统后端服务已启动');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API 前缀: http://localhost:${PORT}/api`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  数据库: 内存存储`);
      console.log('========================================');
      console.log('  默认管理员账户:');
      console.log('  用户名: admin');
      console.log('  密码: admin123');
      console.log('========================================');
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
};

startServer();
