require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const paymentRoutes = require('./routes/payment');
const mallRoutes = require('./routes/mall');
const financeRoutes = require('./routes/finance');
const servicesRoutes = require('./routes/services');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 58938;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48938}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/mall', mallRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '国家电网综合能源服务门户API运行正常' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 后端服务已启动`);
  console.log(`📍 监听地址: http://127.0.0.1:${PORT}`);
  console.log(`🔍 健康检查: http://127.0.0.1:${PORT}/api/health`);
});
