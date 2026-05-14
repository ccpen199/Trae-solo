require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { initDatabase, seedData } = require('./database');
const { error: errorResponse, success } = require('./utils/response');

const authRoutes = require('./routes/auth');
const flashSaleRoutes = require('./routes/flash-sale');
const reminderRoutes = require('./routes/reminder');
const logisticsRoutes = require('./routes/logistics');
const shareRoutes = require('./routes/share');

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT) || 12671;
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT) || 12672;

const app = express();

app.use(morgan('combined'));

app.use(cors({
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json(success({
    name: 'ME 淘 Web 端 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth/*',
      flash_sales: '/api/flash-sale/*',
      reminders: '/api/reminder/*',
      logistics: '/api/logistics/*',
      share: '/api/share/*'
    }
  }, 'API 服务正常运行'));
});

app.get('/api/health', (req, res) => {
  res.json(success({
    timestamp: new Date().toISOString(),
    status: 'healthy'
  }));
});

app.use('/api/auth', authRoutes);
app.use('/api/flash-sale', flashSaleRoutes);
app.use('/api/reminder', reminderRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/share', shareRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json(errorResponse('服务器内部错误', {
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  }));
});

const startServer = async () => {
  try {
    initDatabase();
    seedData();
    
    const server = app.listen(BACKEND_PORT, () => {
      console.log(`========================================`);
      console.log(`ME 淘 后端服务已启动`);
      console.log(`端口: ${BACKEND_PORT}`);
      console.log(`访问地址: http://localhost:${BACKEND_PORT}`);
      console.log(`前端地址: http://localhost:${FRONTEND_PORT}`);
      console.log(`========================================`);
      console.log(`测试账号:`);
      console.log(`  账号: test@taobao`);
      console.log(`  密码: 123456`);
      console.log(`========================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${BACKEND_PORT} 已被占用，请先释放端口或修改 .env 配置`);
        process.exit(1);
      }
      console.error('服务器启动失败:', err);
      process.exit(1);
    });

    const gracefulShutdown = () => {
      console.log('\n正在关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
      setTimeout(() => {
        process.exit(0);
      }, 5000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
};

startServer();
