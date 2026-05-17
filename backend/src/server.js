require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const { errorHandler } = require('./middleware');

const usersRouter = require('./routes/users');
const requestsRouter = require('./routes/requests');
const ordersRouter = require('./routes/orders');
const messagesRouter = require('./routes/messages');
const teachersRouter = require('./routes/teachers');

const app = express();
const PORT = process.env.PORT || 48121;

app.use(cors({
  origin: ['http://localhost:48122', 'http://127.0.0.1:48122'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', usersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/teachers', teachersRouter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const startServer = async () => {
  try {
    await initDatabase();
    console.log('数据库初始化完成');
    
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`🚀 后端服务已启动`);
      console.log(`📍 访问地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
};

startServer();
