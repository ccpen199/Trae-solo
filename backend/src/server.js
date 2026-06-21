require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 59290;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:49290',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.path}`);
  next();
});

const healthRouter = require('./routes/health');
const identityRouter = require('./routes/identity');
const outletRouter = require('./routes/outlets');
const userRouter = require('./routes/users');
const agentRouter = require('./routes/agent');
const adminRouter = require('./routes/admin');

app.use('/api/health', healthRouter);
app.use('/api/identity', identityRouter);
app.use('/api/outlets', outletRouter);
app.use('/api/users', userRouter);
app.use('/api/agent', agentRouter);
app.use('/api/admin', adminRouter);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`========================================`);
  console.log(`  重庆市全域政务服务移动中台系统`);
  console.log(`  后端服务启动成功`);
  console.log(`  端口: ${PORT}`);
  console.log(`  地址: http://127.0.0.1:${PORT}`);
  console.log(`========================================`);
});

module.exports = app;
