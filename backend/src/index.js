const express = require('express');
const cors = require('cors');
require('dotenv').config();

const videosRouter = require('./routes/videos');

const app = express();
const PORT = process.env.PORT || 47921;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:47922',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/videos', videosRouter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
    message: '服务正常运行'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    data: null,
    message: '服务器内部错误: ' + err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📡 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
