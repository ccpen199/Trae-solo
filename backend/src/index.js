require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const { portCheck } = require('./utils/portCheck');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use(limiter);

require('./database/init')();
require('./websocket/handler')(io);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/live', authMiddleware, require('./routes/live'));
app.use('/api/flash-sale', authMiddleware, require('./routes/flashSale'));
app.use('/api/inventory', authMiddleware, require('./routes/inventory'));
app.use('/api/order', authMiddleware, require('./routes/order'));
app.use('/api/timeline', authMiddleware, require('./routes/timeline'));
app.use('/api/report', authMiddleware, require('./routes/report'));
app.use('/api/user', authMiddleware, require('./routes/user'));

app.use(errorHandler);

const API_PORT = parseInt(process.env.PORT) || 9876;

async function startServer() {
  try {
    const portAvailable = await portCheck(API_PORT);
    if (!portAvailable) {
      logger.error(`端口 ${API_PORT} 已被占用，请检查配置或使用其他端口`);
      logger.info('可用端口建议: 9878, 9879, 9880, 9881, 9882');
      process.exit(1);
    }

    server.listen(API_PORT, () => {
      logger.info(`直播带货系统后端服务已启动`);
      logger.info(`API 端口: ${API_PORT}`);
      logger.info(`WebSocket 端口: ${process.env.WS_PORT || 9877} (与 HTTP 共享)`);
      logger.info(`环境: ${process.env.NODE_ENV}`);
      console.log(`\n========================================`);
      console.log(`  直播带货系统 - 后端服务已启动`);
      console.log(`========================================`);
      console.log(`  API 地址: http://localhost:${API_PORT}`);
      console.log(`  WebSocket: ws://localhost:${API_PORT}`);
      console.log(`  健康检查: http://localhost:${API_PORT}/api/health`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
