require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
if (!fs.existsSync(dbPath)) {
  console.log('数据库不存在，正在初始化...');
  require('./db/init');
}

const app = express();
const PORT = process.env.PORT || 11260;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11261';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: '请求体格式错误',
      data: null
    });
  }
  console.error('服务器错误:', err);
  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
    data: null
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      port: PORT
    }
  });
});

const authRoutes = require('./routes/auth');
const productBarsRoutes = require('./routes/productBars');
const postsRoutes = require('./routes/posts');
const reportsRoutes = require('./routes/reports');
const operatorRoutes = require('./routes/operator');
const productsRoutes = require('./routes/products');

app.use('/api/auth', authRoutes);
app.use('/api/product-bars', productBarsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/products', productsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    data: null
  });
});

app.use((err, req, res, next) => {
  console.error('未处理的错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  产品吧后端服务已启动`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  前端地址: ${FRONTEND_URL}`);
  console.log(`========================================`);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
