require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const PORT = process.env.PORT || 11341;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11342';

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '网约车派单系统后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`网约车派单系统后端服务启动成功`);
  console.log(`========================================`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`前端地址: ${FRONTEND_URL}`);
  console.log(`数据库: SQLite (data/app.sqlite)`);
  console.log(`========================================`);
  console.log(`默认账号:`);
  console.log(`  管理员: admin / admin123`);
  console.log(`  调度员: dispatcher / 123456`);
  console.log(`  客服: cs / 123456`);
  console.log(`  风控: risk / 123456`);
  console.log(`  乘客: passenger1 / 123456`);
  console.log(`  司机: driver1 / 123456, driver2 / 123456`);
  console.log(`========================================`);
});
