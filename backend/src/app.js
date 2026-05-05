require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectRedis } = require('./config/redis');

const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const productRoutes = require('./routes/productRoutes');
const stockInRoutes = require('./routes/stockInRoutes');
const stockOutRoutes = require('./routes/stockOutRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 22411;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:22412',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '库存管理系统后端服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-in', stockInRoutes);
app.use('/api/stock-out', stockOutRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/logs', logRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    return res.status(400).json({
      success: false,
      message: '请求体JSON格式错误'
    });
  }

  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

const startServer = async () => {
  try {
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  库存管理系统后端服务已启动');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API路径: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;