require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const store = require('./data/store');

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const topicRoutes = require('./routes/topics');
const replyRoutes = require('./routes/replies');

const app = express();
const PORT = process.env.PORT || 22301;

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:22302',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'BBS Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/replies', replyRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

const startServer = async () => {
  try {
    await store.initStore();

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  企业内部BBS系统后端已启动`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  API地址: http://localhost:${PORT}/api`);
      console.log(`========================================`);
      console.log(`  管理员账号: admin / admin123`);
      console.log(`  注意: 当前使用内存存储，重启后数据会丢失`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
};

startServer();
