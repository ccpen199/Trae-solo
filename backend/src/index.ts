import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config, validateConfig } from './config';
import { getDb, closeDb } from './database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import { setupWebSocket } from './websocket';

validateConfig();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(
  cors({
    origin: [
      'http://localhost:12682',
      'http://127.0.0.1:12682',
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

setupWebSocket(wss);

const startServer = () => {
  try {
    getDb();
    console.log('✅ 数据库连接成功');
    
    server.listen(config.port, () => {
      console.log(`🚀 LinkWorld 后端服务已启动`);
      console.log(`📍 服务地址: http://localhost:${config.port}`);
      console.log(`🔌 WebSocket: ws://localhost:${config.port}/ws`);
      console.log(`📊 健康检查: http://localhost:${config.port}/api/health`);
    });
    
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${config.port} 已被占用`);
        process.exit(1);
      }
      console.error('❌ 服务器启动失败:', error);
    });
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('🔄 正在关闭服务器...');
  server.close(() => {
    closeDb();
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 正在关闭服务器...');
  server.close(() => {
    closeDb();
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

startServer();
