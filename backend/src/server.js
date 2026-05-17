require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 48331;

app.use(cors({
  origin: ['http://localhost:48332', 'http://127.0.0.1:48332'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const initDB = require('./config/database');

const authRoutes = require('./routes/auth');
const planRoutes = require('./routes/plans');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 NowHere Backend 启动成功!`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`💾 数据库: ${path.resolve(__dirname, '../data/app.sqlite')}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

module.exports = app;
