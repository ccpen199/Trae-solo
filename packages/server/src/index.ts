import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './data-source.js';
import { env } from './config/env.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import retailRoutes from './routes/retail.routes.js';
import farmerRoutes from './routes/farmer.routes.js';
import disputeRoutes from './routes/dispute.routes.js';
import traceabilityRoutes from './routes/traceability.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'agri-erp-server',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/retail', retailRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/traceability', traceabilityRoutes);

app.use((err: Error & { status?: number; code?: string }, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 'ECONNREFUSED') {
    message = '数据库连接失败';
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API 路由不存在',
  });
});

const PORT = env.PORT || 3001;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功');

    app.listen(PORT, () => {
      console.log(`🚀 服务启动成功，端口: ${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log(`🔧 环境: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app;
