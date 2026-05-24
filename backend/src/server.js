require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/member');
const transactionRoutes = require('./routes/transaction');
const stationRoutes = require('./routes/station');
const shiftRoutes = require('./routes/shift');
const reportRoutes = require('./routes/report');

const app = express();
const PORT = process.env.BACKEND_PORT || 52669;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 42669}`, `http://localhost:${process.env.FRONTEND_PORT || 42669}`],
  credentials: true
}));

app.use(express.json());
app.use(morgan('combined'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/report', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`加油站会员系统后端服务已启动`);
  console.log(`服务地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
