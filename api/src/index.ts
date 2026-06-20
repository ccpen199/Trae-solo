import 'dotenv/config';
import express, { Request, Response, NextFunction, Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import artistsRoutes from './routes/artists';
import castingsRoutes from './routes/castings';
import modelCardsRoutes from './routes/modelCards';
import searchRoutes from './routes/search';
import securityRoutes from './routes/security';
import agencyRoutes from './routes/agency';

const app: Express = express();
const HOST = '127.0.0.1';
const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3001;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMITED',
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: '登录尝试次数过多，请稍后再试',
    code: 'AUTH_RATE_LIMITED',
  },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/castings', castingsRoutes);
app.use('/api/model-cards', modelCardsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/agency', agencyRoutes);

app.use((req: Request, res: Response): void => {
  res.status(404).json({
    error: '资源不存在',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
  });
});

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('API Error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Talent Platform API Server`);
  console.log(`📡 服务器运行在: http://${HOST}:${PORT}`);
  console.log(`🏥 健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}\n`);
});

export default app;
