require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const sleepRoutes = require('./routes/sleep');
const musicRoutes = require('./routes/music');
const postsRoutes = require('./routes/posts');
const preferencesRoutes = require('./routes/preferences');

const app = express();
const PORT = process.env.PORT || 48351;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:48352',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/preferences', preferencesRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '睡眠助眠器后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 睡眠助眠器后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🕒 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});
