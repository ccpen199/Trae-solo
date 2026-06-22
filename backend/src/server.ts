import 'reflect-metadata';
import { createServer } from 'http';
import path from 'path';
import app from './app.js';
import { AppDataSource } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { initWebSocketService } from './services/websocket.service.js';
import { startDispatchScheduler } from './services/dispatch.service.js';
import { startTimeoutMonitor } from './services/timeout.service.js';
import { seedDemoData } from './utils/seed.js';
import { loadProjectEnv } from './utils/loadEnv.js';

loadProjectEnv();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.SERVER_PORT || '59312');
const WS_PORT = parseInt(process.env.WS_PORT || '59313');
const HOST = '127.0.0.1';

const startServer = async () => {
  try {
    console.log('正在启动服务...');

    await AppDataSource.initialize();
    console.log('数据库连接成功');
    await seedDemoData();
    console.log('演示数据已就绪');

    await connectRedis();
    console.log('Redis 连接成功');

    const httpServer = createServer(app);
    const wsServer = createServer();

    initWebSocketService(wsServer);
    console.log('WebSocket 服务初始化完成');

    startDispatchScheduler();
    console.log('智能派单调度器已启动');

    startTimeoutMonitor();
    console.log('超时监控服务已启动');

    httpServer.listen(PORT, HOST, () => {
      console.log(`HTTP 服务运行在 http://${HOST}:${PORT}`);
      console.log(`健康检查: http://${HOST}:${PORT}/api/health`);
    });

    wsServer.listen(WS_PORT, HOST, () => {
      console.log(`WebSocket 服务运行在 ws://${HOST}:${WS_PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`收到 ${signal} 信号，正在关闭服务...`);
      try {
        httpServer.close();
        wsServer.close();
        await AppDataSource.destroy();
        console.log('服务已优雅关闭');
        process.exit(0);
      } catch (err) {
        console.error('关闭服务时发生错误:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的 Promise 拒绝:', reason, promise);
    });
  } catch (err) {
    console.error('启动服务失败:', err);
    process.exit(1);
  }
};

startServer();
