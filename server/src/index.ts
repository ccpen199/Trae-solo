import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/error';
import authRoutes from './routes/auth';
import tourRoutes from './routes/tours';
import groupRoutes from './routes/groups';
import orderRoutes from './routes/orders';
import guideRoutes from './routes/guide';
import formRoutes from './routes/forms';
import businessRoutes from './routes/business';
import { ApiResponse } from './types';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8341;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9527';

const corsOptions = {
  origin: [FRONTEND_URL, 'http://localhost:9527', 'http://127.0.0.1:9527'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      port: PORT,
      nodeVersion: process.version,
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

app.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      service: '旅游线路预订系统后端服务',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        tours: '/api/tours',
        groups: '/api/groups',
        orders: '/api/orders',
        guide: '/api/guide',
        forms: '/api/forms',
        business: '/api/business',
      },
      docs: '请参考 API 文档了解详细使用方法',
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/business', businessRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 旅游线路预订系统后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔒 允许的前端地址: ${FRONTEND_URL}`);
  console.log(`📅 启动时间: ${new Date().toISOString()}`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在优雅关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在优雅关闭服务...');
  process.exit(0);
});
