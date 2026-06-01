require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const initDB = require('./db');
const authRoutes = require('./routes/auth');
const giftRoutes = require('./routes/gifts');
const orderRoutes = require('./routes/orders');
const activityRoutes = require('./routes/activities');
const riskRoutes = require('./routes/risk');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

const PORT = process.env.BACKEND_PORT || 53414;

const app = express();

const logDir = path.join(__dirname, '..');
const accessLogStream = fs.createWriteStream(path.join(logDir, 'backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43414}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = initDB();
app.set('db', db);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
