import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config } from './config';
import prisma from './lib/prisma';
import redis from './lib/redis';

import authRouter from './routes/auth';
import roomsRouter from './routes/rooms';
import reservationsRouter from './routes/reservations';
import checkInsRouter from './routes/checkIns';
import billsRouter from './routes/bills';
import cleaningRouter from './routes/cleaning';
import reportsRouter from './routes/reports';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({
  origin: ['http://localhost:4321', 'http://127.0.0.1:4321'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hotel PMS API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/check-ins', checkInsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/cleaning', cleaningRouter);
app.use('/api/reports', reportsRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
  });
});

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received:', data);
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

const subscribeToRedis = async () => {
  try {
    const subscriber = redis.duplicate();

    await subscriber.subscribe('room_status_change', 'inventory_change', 'rate_change');

    subscriber.on('message', (channel, message) => {
      console.log(`Redis message on channel ${channel}:`, message);

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            channel,
            data: JSON.parse(message),
          }));
        }
      });
    });

    console.log('Subscribed to Redis channels');
  } catch (error) {
    console.error('Redis subscription error:', error);
  }
};

const startServer = async () => {
  console.log('\n============================================');
  console.log('  🏨 正在启动 Hotel PMS 后端服务...');
  console.log('============================================\n');

  let dbConnected = false;
  let redisConnected = false;

  try {
    await prisma.$connect();
    console.log('✅ 已连接到 PostgreSQL 数据库');
    dbConnected = true;
  } catch (error) {
    console.log('❌ PostgreSQL 连接失败:', error);
    console.log('   请确保 Docker 容器已运行: docker-compose up -d');
  }

  try {
    await redis.ping();
    console.log('✅ 已连接到 Redis');
    redisConnected = true;
    await subscribeToRedis();
  } catch (error) {
    console.log('❌ Redis 连接失败:', error);
    console.log('   请确保 Docker 容器已运行: docker-compose up -d');
  }

  server.listen(config.port, () => {
    console.log(`\n============================================`);
    console.log(`  🏨 Hotel PMS Backend Server Started`);
    console.log(`============================================`);
    console.log(`  📡 API Server:  http://localhost:${config.port}`);
    console.log(`  🔌 WebSocket:   ws://localhost:${config.port}`);
    console.log(`  📅 Database:    PostgreSQL:54320 (${dbConnected ? '已连接' : '未连接'})`);
    console.log(`  📦 Cache:       Redis:63790 (${redisConnected ? '已连接' : '未连接'})`);
    console.log(`============================================`);
    console.log(`  ⚠️  端口说明:`);
    console.log(`     - 9876 是配置的默认后端端口`);
    console.log(`     - 如需修改，请在 .env 文件中设置 PORT`);
    console.log(`     - 如遇端口冲突，请终止占用端口的进程`);
    console.log(`============================================`);
    console.log(`  🚀 前端访问: http://localhost:4321`);
    console.log(`============================================\n`);

    if (!dbConnected || !redisConnected) {
      console.log('⚠️  警告: 数据库或Redis未连接');
      console.log('   请运行以下命令启动服务:');
      console.log('   docker-compose up -d');
      console.log('   npm run prisma:push');
      console.log('   npm run prisma:seed');
      console.log('\n');
    }
  });
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await prisma.$disconnect();
    await redis.quit();
  } catch (e) {
    console.log('Error during shutdown:', e);
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await prisma.$disconnect();
    await redis.quit();
  } catch (e) {
    console.log('Error during shutdown:', e);
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
