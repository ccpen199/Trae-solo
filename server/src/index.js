const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { syncDatabase, createDefaultAdmin } = require('./models');
const redisService = require('./config/redis');
const { testConnection } = require('./config/database');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 22361;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:22362',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '团购网站后端服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
  });
});

const startServer = async () => {
  try {
    console.log('正在初始化团购网站后端服务...');
    
    await testConnection();
    
    await syncDatabase(false);
    
    await createDefaultAdmin();
    
    await redisService.connect();
    
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  团购网站后端服务已启动`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  API 基础路径: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/health`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
