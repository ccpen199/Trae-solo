require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { testConnection, syncDatabase } = require('./config/database');
const { initRedis } = require('./config/redis');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 12223;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:22230',
    'http://localhost:22230',
    'http://127.0.0.1:22230'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/', routes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: '无效的token'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const startServer = async () => {
  try {
    console.log('🚀 正在启动 XM-12223 标准化套餐系统...');
    console.log('========================================');
    
    console.log('\n📦 初始化 Redis...');
    await initRedis();
    
    console.log('\n🗄️  连接数据库...');
    await testConnection();
    
    console.log('\n📋 同步数据库表...');
    await syncDatabase();
    
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('✅ 服务启动成功!');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 API 文档: http://localhost:${PORT}/`);
      console.log(`🌐 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:22230'}`);
      console.log('========================================');
      console.log(`📅 启动时间: ${new Date().toLocaleString('zh-CN')}`);
    });
  } catch (error) {
    console.error('\n❌ 服务启动失败:', error.message);
    console.error('💡 请检查数据库和 Redis 配置是否正确');
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', () => {
  console.log('\n⚠️  收到 SIGTERM 信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  收到 SIGINT 信号，正在关闭服务...');
  process.exit(0);
});

module.exports = app;
