require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const stationRoutes = require('./routes/stations.routes');
const inverterRoutes = require('./routes/inverter.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const cleaningRoutes = require('./routes/cleaning.routes');
const revenueRoutes = require('./routes/revenue.routes');
const assetRoutes = require('./routes/asset.routes');
const notificationRoutes = require('./routes/notifications.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const { authenticateToken } = require('./middleware/auth');
const { initDatabase, getDb } = require('./config/database');
const initDbModule = require('./init/init-db');

const PORT = process.env.PORT || 110971;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:110972';

async function startServer() {
  console.log('正在初始化数据库...');
  
  await initDatabase();
  
  console.log('数据库初始化完成，正在创建表和数据...');
  
  await initDbModule.initializeDatabase();
  
  const db = getDb();
  
  const app = express();

  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected'
    });
  });

  app.use('/api/auth', authRoutes);

  app.use('/api/stations', authenticateToken, stationRoutes);
  app.use('/api/inverters', inverterRoutes);
  app.use('/api/maintenance', authenticateToken, maintenanceRoutes);
  app.use('/api/cleaning', authenticateToken, cleaningRoutes);
  app.use('/api/revenue', authenticateToken, revenueRoutes);
  app.use('/api/assets', authenticateToken, assetRoutes);
  app.use('/api/notifications', authenticateToken, notificationRoutes);
  app.use('/api/dashboard', authenticateToken, dashboardRoutes);

  app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: '未授权访问' });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: '数据验证失败', details: err.errors });
    }

    res.status(500).json({ 
      error: '服务器内部错误',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
  });

  app.listen(PORT, () => {
    console.log('========================================');
    console.log('  光伏电站运维系统 - 后端服务');
    console.log('========================================');
    console.log(`  服务地址: http://localhost:${PORT}`);
    console.log(`  前端地址: ${FRONTEND_URL}`);
    console.log(`  数据库: SQLite (${process.env.DB_PATH || './data/app.sqlite'})`);
    console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
    console.log('========================================');
    console.log('  可用测试账号:');
    console.log('  - 管理员: admin / admin123');
    console.log('  - 电站业主: owner / owner123');
    console.log('  - 运维工人: worker / worker123');
    console.log('  - 投资人: investor / investor123');
    console.log('========================================');
  });

  module.exports = app;
}

startServer().catch(err => {
  console.error('服务器启动失败:', err);
  process.exit(1);
});
