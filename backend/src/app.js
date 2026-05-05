require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initializeDatabase, isUsingMemory, getModels } = require('./config/database');
const { connectRedis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 12222;

const allowedOrigins = [
  'http://localhost:22221',
  'http://127.0.0.1:22221',
  `http://localhost:${process.env.PORT || 12222}`
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: {
      service: 'restaurant-management-api',
      timestamp: new Date().toISOString(),
      project: 'xm-12222',
      port: PORT,
      database: isUsingMemory() ? 'Memory Store' : 'PostgreSQL'
    }
  });
});

const startServer = async () => {
  try {
    await initializeDatabase();
    
    if (!isUsingMemory()) {
      const db = require('./models');
      console.log('同步数据库表结构...');
      await db.sequelize.sync({ alter: true });
      
      const initDb = require('./config/init-db');
      try {
        await initDb.initializeDefaultData();
      } catch (e) {
        console.log('默认数据可能已存在，跳过初始化');
      }
    }
    
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/users');
    const tableRoutes = require('./routes/tables');
    const dishRoutes = require('./routes/dishes');
    const orderRoutes = require('./routes/orders');
    const paymentRoutes = require('./routes/payments');
    const inventoryRoutes = require('./routes/inventories');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/tables', tableRoutes);
    app.use('/api/dishes', dishRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/inventories', inventoryRoutes);
    
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      
      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
          code: 401,
          message: '未授权访问'
        });
      }
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          code: 400,
          message: err.message || '数据验证失败'
        });
      }
      
      return res.status(500).json({
        code: 500,
        message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
      });
    });
    
    app.use('*', (req, res) => {
      res.status(404).json({
        code: 404,
        message: '接口不存在'
      });
    });
    
    try {
      await connectRedis();
    } catch (err) {
      console.warn('Redis 连接失败，将使用内存模式运行');
    }
    
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  餐饮管理系统后端服务已启动');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API 地址: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log('========================================');
      console.log(`  项目: xm-12222`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  数据库: ${isUsingMemory() ? '内存存储 (降级模式)' : 'PostgreSQL'}`);
      console.log('========================================');
      console.log('');
      console.log('默认登录账号:');
      console.log('  管理员: admin / admin123');
      console.log('  服务员: waiter / 123456');
      console.log('  店长: manager / 123456');
      console.log('  收银员: cashier / 123456');
      console.log('');
    });
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    console.error('');
    console.error('请检查:');
    console.error('1. 数据库配置是否正确（查看 .env 文件）');
    console.error('');
    process.exit(1);
  }
};

startServer();
