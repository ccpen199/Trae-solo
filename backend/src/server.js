require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./database/init');

const authRoutes = require('./routes/auth');
const planetRoutes = require('./routes/planets');
const topicRoutes = require('./routes/topics');

const app = express();
const PORT = process.env.PORT || 47591;

app.use(cors({
  origin: ['http://localhost:47592', 'http://127.0.0.1:47592'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/planets', planetRoutes);
app.use('/api/topics', topicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '知识星球 API 服务运行正常', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 知识星球后端服务启动成功                               ║
║                                                           ║
║   📡 服务地址: http://localhost:${PORT}                      ║
║   🔍 健康检查: http://localhost:${PORT}/api/health            ║
║   📦 数据库: SQLite (data/app.sqlite)                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
