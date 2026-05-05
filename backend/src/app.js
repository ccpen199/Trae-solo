const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const { initRedis } = require('./config/redis');

const authRoutes = require('./routes/auth');
const vehiclesRoutes = require('./routes/vehicles');
const dataCollectionRoutes = require('./routes/data-collection');
const faultsRoutes = require('./routes/faults');
const calibrationRoutes = require('./routes/calibration');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 12241;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:12242',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 as test');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbType: db.usePg ? 'postgresql' : 'sqlite',
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      error: err.message,
      database: 'disconnected',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/data-collection', dataCollectionRoutes);
app.use('/api/faults', faultsRoutes);
app.use('/api/calibration', calibrationRoutes);
app.use('/api/reports', reportsRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  });
});

const startServer = async () => {
  try {
    console.log('正在初始化数据库连接...');
    await db.init();
    console.log('数据库连接成功');

    console.log('正在初始化Redis连接...');
    await initRedis();

    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('ECU诊断与标定管理平台后端服务已启动');
      console.log(`访问地址: http://localhost:${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
      console.log('默认账户:');
      console.log('  管理员: admin / admin123');
      console.log('  维修技师: user / user123');
      console.log('='.repeat(60));
      console.log('数据库: SQLite (本地降级模式)');
      console.log('Redis: 自动降级到内存缓存');
      console.log('='.repeat(60));
    });
  } catch (err) {
    console.error('启动服务失败:', err);
    process.exit(1);
  }
};

startServer();
