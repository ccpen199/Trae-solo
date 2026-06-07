require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const trademarkRoutes = require('./routes/trademarks');
const transferRoutes = require('./routes/transfers');
const patentRoutes = require('./routes/patents');
const copyrightRoutes = require('./routes/copyrights');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 58880;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48880}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/trademarks', trademarkRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/patents', patentRoutes);
app.use('/api/copyrights', copyrightRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IP Platform Backend',
    timestamp: new Date().toISOString(),
    port: PORT,
    database: 'sqlite',
    version: '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: '知识产权全生命周期服务平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      trademarks: '/api/trademarks',
      transfers: '/api/transfers',
      patents: '/api/patents',
      copyrights: '/api/copyrights',
      admin: '/api/admin'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  const logContent = `
================================================
知识产权全生命周期服务平台后端服务启动成功
监听地址: http://127.0.0.1:${PORT}
API 前缀: http://127.0.0.1:${PORT}/api
健康检查: http://127.0.0.1:${PORT}/api/health
数据库: SQLite (${path.join(__dirname, 'data/app.sqlite')})
启动时间: ${new Date().toLocaleString('zh-CN')}
================================================
  `;
  console.log(logContent);
  fs.writeFileSync(path.join(__dirname, '../backend.log'), logContent);
});

module.exports = app;
