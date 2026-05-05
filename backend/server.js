require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');

// 初始化数据库
require('./database/init');

const app = express();
const PORT = process.env.BACKEND_PORT || 23143;

// CORS配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:33143',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
const routes = require('./routes');
app.use('/api', routes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      code: 400,
      message: '请求体格式错误',
      data: null
    });
  }

  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    data: null
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  汽车养护预约服务平台 - 后端服务');
  console.log('========================================');
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API地址:  http://localhost:${PORT}/api`);
  console.log(`  启动时间: ${new Date().toLocaleString()}`);
  console.log('========================================');
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
