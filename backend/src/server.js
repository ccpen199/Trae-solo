const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../../.env' });

const { initDatabase } = require('./models/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT_BACKEND || 48241;

app.use(cors({
  origin: ['http://localhost:48242', 'http://127.0.0.1:48242'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: '服务器运行正常' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 快问律师后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`💾 数据库: SQLite (./data/app.sqlite)`);
});
