import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import { initDB } from './db';
import { seed } from './seed';

import authRouter from './routes/auth';
import brandsRouter from './routes/brands';
import couriersRouter from './routes/couriers';
import ordersRouter from './routes/orders';
import priceRouter from './routes/price';
import dashboardRouter from './routes/dashboard';
import openapiRouter from './routes/openapi';
import notificationsRouter from './routes/notifications';
import complaintsRouter from './routes/complaints';
import branchesRouter from './routes/branches';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.BACKEND_PORT || '59219');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:49219';

app.use(cors({
  origin: [
    FRONTEND_URL,
    FRONTEND_URL.replace('127.0.0.1', 'localhost'),
    `http://127.0.0.1:${process.env.FRONTEND_PORT || '49219'}`,
    `http://localhost:${process.env.FRONTEND_PORT || '49219'}`,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Key', 'X-App-Sign'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

initDB();
try {
  seed();
} catch (e) {
  console.log('Seed warning:', e);
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'express-logistics-open-platform',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/couriers', couriersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/price', priceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/open', openapiRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/branches', branchesRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || '服务器内部错误',
  });
});

app.use((_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});
