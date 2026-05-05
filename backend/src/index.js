const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const roomTypesRouter = require('./routes/roomTypes');
const roomsRouter = require('./routes/rooms');

const app = express();
const PORT = process.env.PORT || 22211;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22212';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '酒店管理系统API服务正常运行',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/room-types', roomTypesRouter);
app.use('/api/rooms', roomsRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  酒店管理系统后端服务`);
  console.log(`========================================`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API地址: http://localhost:${PORT}/api`);
  console.log(`  前端地址: ${FRONTEND_URL}`);
  console.log(`========================================`);
  console.log(`  服务已启动，时间: ${new Date().toLocaleString()}`);
  console.log(`========================================`);
});
