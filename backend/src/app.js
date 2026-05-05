const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const routes = require('./routes');

const app = express();

app.use(cors({
  origin: ['http://localhost:22216', 'http://127.0.0.1:22216'],
  credentials: true,
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: '简易搜索引擎后端',
    version: '1.0.0',
    port: config.port,
    endpoints: {
      health: 'GET /api/health',
      indexStatus: 'GET /api/index/status',
      generateIndex: 'POST /api/index/generate',
      clearIndex: 'POST /api/index/clear',
      startWatch: 'POST /api/index/watch/start',
      stopWatch: 'POST /api/index/watch/stop',
      search: 'POST /api/search',
      openFile: 'GET /api/file/open',
    },
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: err.message || '内部服务器错误',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.path,
    method: req.method,
  });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log('========================================');
  console.log('简易搜索引擎后端已启动');
  console.log(`端口: ${config.port}`);
  console.log(`访问地址: http://localhost:${config.port}`);
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
