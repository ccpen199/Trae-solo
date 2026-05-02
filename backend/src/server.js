require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const commonRoutes = require('./routes/common');

const app = express();
const PORT = process.env.PORT || 11151;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:11152';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: 'Cross-border Payment System API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/common', commonRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  });
});

async function startServer() {
  try {
    console.log('Initializing database...');
    await db.initDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  跨境支付结算系统 - 后端服务');
      console.log('========================================');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API 地址: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('  默认账号:');
      console.log('  - 系统管理员: admin / admin123');
      console.log('  - 商户操作员: merchant / merchant123');
      console.log('  - 商户管理员: merchant_admin / admin123');
      console.log('  - 支付机构: payment / payment123');
      console.log('  - 合规审核员: compliance / compliance123');
      console.log('  - 财务人员: finance / finance123');
      console.log('  - 银行操作员: bank / bank123');
      console.log('');
      console.log('========================================');
      console.log('');
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
