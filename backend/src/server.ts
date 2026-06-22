import 'reflect-metadata';
import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './app';
import { AppDataSource } from './config/database';
import { connectRedis } from './config/redis';
import { initWebSocketService } from './services/websocket.service';
import { startDispatchScheduler } from './services/dispatch.service';
import { startTimeoutMonitor } from './services/timeout.service';

dotenv.config();

const PORT = parseInt(process.env.SERVER_PORT || '3000');
const WS_PORT = parseInt(process.env.WS_PORT || '3001');

const startServer = async () => {
  try {
    console.log('正在启动服务...');

    await AppDataSource.initialize();
    console.log('数据库连接成功');

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

    httpServer.listen(PORT, () => {
      console.log(`HTTP 服务运行在 http://localhost:${PORT}`);
      console.log(`API 文档: http://localhost:${PORT}/api/v1/docs`);
    });

    wsServer.listen(WS_PORT, () => {
      console.log(`WebSocket 服务运行在 ws://localhost:${WS_PORT}`);
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
