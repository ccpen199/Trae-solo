require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const PORT = process.env.PORT || 11813;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:21813';

const app = express();

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'AR试穿试戴系统后端',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      config: 'GET /api/config',
      users: 'GET /api/users',
      orders: 'GET /api/orders, POST /api/orders',
      products: 'GET /api/products',
      dashboard: 'GET /api/dashboard/stats'
    },
    port: PORT
  });
});

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
  console.log('========================================');
  console.log('  AR试穿试戴系统后端服务');
  console.log('========================================');
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`CORS 来源: ${CORS_ORIGIN}`);
  console.log('========================================');
  console.log('服务已启动，按 Ctrl+C 停止');
});

module.exports = app;
