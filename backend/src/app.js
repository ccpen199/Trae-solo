require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { init: initDb } = require('./config/init-db');

const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
const PORT = process.env.PORT || 111281;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:111282',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

initDb();

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '税务筹划与申报系统 - 后端服务运行正常',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: '请求体格式错误'
    });
  }
  
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
  console.log(`========================================`);
  console.log(`  税务筹划与申报系统 - 后端服务`);
  console.log(`========================================`);
  console.log(`  服务端口: ${PORT}`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
  console.log(`  默认账号 (密码: 123456):`);
  console.log(`  - admin: 系统管理员`);
  console.log(`  - finance1: 财务 (张三)`);
  console.log(`  - advisor1: 税务顾问 (李四)`);
  console.log(`  - manager1: 企业负责人 (王五)`);
  console.log(`========================================`);
});

module.exports = app;
