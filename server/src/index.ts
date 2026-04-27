import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';

import authRoutes from './routes/authRoutes';
import workOrderRoutes from './routes/workOrderRoutes';
import reportRoutes from './routes/reportRoutes';
import qualityRoutes from './routes/qualityRoutes';
import abnormalRoutes from './routes/abnormalRoutes';
import masterDataRoutes from './routes/masterDataRoutes';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      port: config.port,
      nodeEnv: config.nodeEnv,
      portHelp: config.portHelp,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/abnormals', abnormalRoutes);
app.use('/api/master-data', masterDataRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('服务器错误:', err);
  
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : '服务器内部错误',
  });
});

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('============================================');
  console.log('  MES 生产执行系统 - 后端服务');
  console.log('============================================');
  console.log(`  服务已启动`);
  console.log(`  端口: ${PORT}`);
  console.log(`  环境: ${config.nodeEnv}`);
  console.log('============================================');
  console.log('  API 接口:');
  console.log(`  - http://localhost:${PORT}/health`);
  console.log(`  - http://localhost:${PORT}/api/auth/login`);
  console.log(`  - http://localhost:${PORT}/api/config`);
  console.log('============================================');
  console.log(config.portHelp);
  console.log('============================================');
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error('============================================');
    console.error('  端口占用错误!');
    console.error('============================================');
    console.error(`  端口 ${PORT} 已被占用`);
    console.error('');
    console.error('  解决方法:');
    console.error('  1. 查找并关闭占用该端口的进程');
    console.error('  2. 或修改 .env 文件中的 PORT 配置');
    console.error('');
    console.error('  示例修改:');
    console.error('    编辑 server/.env 文件');
    console.error('    修改 PORT=8383 为其他端口');
    console.error('    如: PORT=9000 或 PORT=8080');
    console.error('============================================');
  } else {
    console.error('服务器启动错误:', err);
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app;
