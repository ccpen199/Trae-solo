require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const devicesRouter = require('./routes/devices');
const tagsRouter = require('./routes/tags');
const tasksRouter = require('./routes/tasks');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 48431;

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: ['http://localhost:48432', 'http://192.168.1.38:48432'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    message: '服务运行正常'
  });
});

app.use('/api/devices', devicesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/reports', reportsRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    data: null,
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`
============================================
🚀 推送管理后端服务已启动
📍 监听端口: ${PORT}
🌐 服务地址: http://localhost:${PORT}
📅 启动时间: ${new Date().toLocaleString()}
============================================
  `);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务...');
  process.exit(0);
});
