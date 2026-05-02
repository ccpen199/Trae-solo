require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chat');
const disputeRoutes = require('./routes/disputes');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 111191;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:111192';

const corsOptions = {
  origin: [FRONTEND_URL, 'http://localhost:111192'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'C2C二手交易平台API服务',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      chat: '/api/chat',
      disputes: '/api/disputes',
      admin: '/api/admin'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: '请求体格式错误'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API接口不存在'
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('C2C二手交易平台后端服务已启动');
  console.log('========================================');
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`前端地址: ${FRONTEND_URL}`);
  console.log(`API文档: http://localhost:${PORT}/`);
  console.log('========================================');
  console.log('测试账号:');
  console.log('  管理员:    admin / admin123');
  console.log('  卖家:      seller01 / seller123');
  console.log('  买家:      buyer01 / buyer123');
  console.log('  鉴定师:    appraiser01 / appraiser123');
  console.log('  客服:      cs01 / cs123456');
  console.log('========================================');
});

module.exports = app;
