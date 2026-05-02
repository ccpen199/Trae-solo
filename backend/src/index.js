require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./database');

const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const signingRoutes = require('./routes/signing');
const legalRoutes = require('./routes/legal');
const sealRoutes = require('./routes/seals');

const app = express();
const PORT = parseInt(process.env.PORT) || 9171;
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT) || 9172;

app.use(cors({
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://0.0.0.0:${FRONTEND_PORT}`
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    name: '电子签约系统后端服务',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString(),
    engines: [
      'Time-Stamp Engine',
      'Digital-Signature Engine',
      'Evidence-Block Engine',
      'Seal-Manager Engine'
    ],
    endpoints: {
      auth: '/api/auth',
      contracts: '/api/contracts',
      signing: '/api/signing',
      legal: '/api/legal',
      seals: '/api/seals'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/signing', signingRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/seals', sealRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === '不支持的文件格式') {
    return res.status(400).json({
      success: false,
      message: '上传失败',
      error: '不支持的文件格式，请上传PDF、Word或txt文件'
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: '上传失败',
      error: '文件大小超过限制（最大10MB）'
    });
  }
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalPath
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('   电子签约系统 - 后端服务已启动');
  console.log('========================================');
  console.log(`   访问地址: http://localhost:${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
  console.log(`   前端端口: ${FRONTEND_PORT}`);
  console.log(`   数据库: SQLite (${process.env.DATABASE_PATH || './data/app.sqlite'})`);
  console.log('========================================');
  console.log(`   启动时间: ${new Date().toISOString()}`);
  console.log('========================================');
  console.log('');
});

module.exports = app;
