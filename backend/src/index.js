require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const initDatabase = require('./config/initDB');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const exceptionRoutes = require('./routes/exceptions');
const dispatchRoutes = require('./routes/dispatches');
const messageRoutes = require('./routes/messages');
const vehicleRoutes = require('./routes/vehicles');

const app = express();
const PORT = process.env.PORT || 11139;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '共享单车运营系统后端运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const startServer = async () => {
  try {
    initDatabase();
    
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  共享单车运营系统后端`);
      console.log(`  服务端口: ${PORT}`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  API前缀: http://localhost:${PORT}/api`);
      console.log(`========================================`);
      console.log(`  测试账号:`);
      console.log(`  骑行用户: user1 / 123456`);
      console.log(`  运维员: maintainer1 / 123456`);
      console.log(`  调度员: dispatcher1 / 123456`);
      console.log(`  客服: service1 / 123456`);
      console.log(`  管理员: admin1 / 123456`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
};

startServer();
