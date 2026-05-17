require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const planetRoutes = require('./routes/planetRoutes');
const topicRoutes = require('./routes/topicRoutes');

const app = express();
const PORT = process.env.PORT || 47601;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:47602',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/planets', planetRoutes);
app.use('/api/topics', topicRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '知识星球API服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 知识星球后端服务启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});
