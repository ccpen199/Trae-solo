import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import type { ApiResponse } from '@shared/types';
import { initDatabase } from './models/db.js';
import { authMiddleware } from './middleware/auth.js';

import authRouter from './routes/auth.js';
import accountRouter from './routes/account.js';
import medicalRouter from './routes/medical.js';
import chronicRouter from './routes/chronic.js';
import registrationRouter from './routes/registration.js';
import paymentRouter from './routes/payment.js';
import { notificationRouter, remoteRecordRouter } from './routes/notification.js';
import navigationRouter from './routes/navigation.js';

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || '59308');
const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:49308';
const corsOrigins = (process.env.CORS_ORIGIN || frontendUrl)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    code: 0,
    message: '服务运行正常',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  };
  res.json(response);
});

app.use('/api/auth', authRouter);

app.use('/api/account', authMiddleware, accountRouter);
app.use('/api/medical', authMiddleware, medicalRouter);
app.use('/api/chronic', authMiddleware, chronicRouter);
app.use('/api/registration', authMiddleware, registrationRouter);
app.use('/api/payment', authMiddleware, paymentRouter);
app.use('/api/notifications', authMiddleware, notificationRouter);
app.use('/api/remote-record', authMiddleware, remoteRecordRouter);
app.use('/api/navigation', authMiddleware, navigationRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  const response: ApiResponse<null> = {
    code: 500,
    message: err.message || '服务器内部错误',
    data: null
  };
  res.status(500).json(response);
});

app.use((req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    code: 404,
    message: '接口不存在',
    data: null
  };
  res.status(404).json(response);
});

initDatabase();

app.listen(PORT, HOST, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   江苏省医保服务一体化数字终端 - 后端API服务              ║
  ║                                                          ║
  ║   服务地址: http://${HOST}:${PORT}                     ║
  ║   健康检查: http://${HOST}:${PORT}/api/health         ║
  ║                                                          ║
  ║   服务已启动，等待请求...                                ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
