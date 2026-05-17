require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 47791;

const accessLogStream = fs.createWriteStream(path.join(__dirname, '../server.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:47792',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/songs', require('./routes/songs'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/rankings', require('./routes/rankings'));
app.use('/api/ads', require('./routes/advertisements'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/home', require('./routes/home'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

const initDB = require('./database/init');

app.listen(PORT, () => {
  console.log(`
=========================================
抖音听歌后端服务已启动
端口: ${PORT}
环境: ${process.env.NODE_ENV || 'development'}
访问地址: http://localhost:${PORT}
健康检查: http://localhost:${PORT}/api/health
=========================================
  `);
});

module.exports = app;
