require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const summaryRoutes = require('./routes/summaries');
const activityRoutes = require('./routes/activities');
const circleRoutes = require('./routes/circles');

const app = express();
const PORT = process.env.PORT || 48011;

app.use(cors({
  origin: ['http://localhost:48012', 'http://127.0.0.1:48012'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/circles', circleRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '课代表平台API运行正常', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
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
  console.log(`🚀 课代表平台后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
