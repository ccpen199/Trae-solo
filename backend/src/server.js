const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const initDatabase = require('./utils/initDb');
const authRoutes = require('./routes/authRoutes');
const flightRoutes = require('./routes/flightRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 11611;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:11612';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API端点不存在' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`航班订票系统后端服务已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`API地址: http://localhost:${PORT}/api`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`CORS允许: ${CORS_ORIGIN}`);
  console.log(`========================================`);
  console.log(`测试账号:`);
  console.log(`  - 管理员: admin / 123456`);
  console.log(`  - 旅客: passenger1 / 123456`);
  console.log(`  - 代理: agent1 / 123456`);
  console.log(`  - 客服: service1 / 123456`);
  console.log(`  - 航司: airline1 / 123456`);
  console.log(`========================================`);
});

module.exports = app;
