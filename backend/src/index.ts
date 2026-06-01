import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import mastersRoutes from './routes/masters';
import ordersRoutes from './routes/orders';
import refundsRoutes from './routes/refunds';
import shiftsRoutes from './routes/shifts';
import reconciliationRoutes from './routes/reconciliation';
import reportsRoutes from './routes/reports';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '53420');
const HOST = '127.0.0.1';

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 43420}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/refunds', refundsRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/reports', reportsRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    code: 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
  console.log(`API base: http://${HOST}:${PORT}/api`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
