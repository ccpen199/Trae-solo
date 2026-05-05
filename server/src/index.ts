import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, AppError } from './middleware/error';

const app = express();

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS 配置
app.use(cors({
  origin: ['http://localhost:22532', 'http://127.0.0.1:22532'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 路由
app.use('/api', routes);

// 根路径
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: '猫扑联盟系统 API',
    version: '1.0.0',
    docs: '请参考 API 文档',
  });
});

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error && err.message) {
    if (err.message.includes('不存在') || err.message.includes('已存在')) {
      return res.status(400).json({
        code: 400,
        message: err.message,
      });
    }
    if (err.message.includes('不能') || err.message.includes('只有')) {
      return res.status(403).json({
        code: 403,
        message: err.message,
      });
    }
  }
  errorHandler(err, req, res, next);
});

// 启动服务器
const server = app.listen(config.port, () => {
  console.log(`
========================================
  🚀 猫扑联盟系统后端服务已启动
========================================
  📡 服务地址: http://localhost:${config.port}
  📚 API 前缀: http://localhost:${config.port}/api
  🌐 环境: ${config.nodeEnv}
========================================
  `);
});

// 优雅退出
process.on('SIGTERM', () => {
  console.log('SIGTERM 信号接收，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 信号接收，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app;
