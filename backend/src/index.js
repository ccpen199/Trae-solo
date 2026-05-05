require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const initDatabase = require('./config/initDb');

const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const ordersRoutes = require('./routes/orders');
const depositOrdersRoutes = require('./routes/depositOrders');
const productsRoutes = require('./routes/products');
const commonRoutes = require('./routes/common');

const app = express();
const PORT = process.env.PORT || 20779;

console.log('正在初始化数据库...');
initDatabase();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:30779',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/deposit-orders', depositOrdersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/common', commonRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
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

app.listen(PORT, () => {
  console.log(`
===========================================
  销售仓储财务一体化后台管理系统
===========================================
  后端服务已启动
  端口: ${PORT}
  访问地址: http://localhost:${PORT}
  健康检查: http://localhost:${PORT}/health
===========================================
  默认账户:
  - 超级管理员: admin / admin123
  - 销售: sales01 / 123456
  - 仓库: warehouse01 / 123456
  - 财务: finance01 / 123456
  - 客服: cs01 / 123456
===========================================
  `);
});

module.exports = app;
