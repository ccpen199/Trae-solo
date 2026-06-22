import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dayjs from 'dayjs';
import path from 'path';
import { initDatabase } from './utils/initDB';
import { success } from './utils/response';

import authRouter from './routes/auth';
import workerRouter from './routes/worker';
import enterpriseRouter from './routes/enterprise';
import jobRouter from './routes/job';
import wageRouter from './routes/wage';
import riskRouter from './routes/risk';
import serviceRouter from './routes/service';

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 58930;
const HOST = '127.0.0.1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:48930';

initDatabase();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: [FRONTEND_URL, 'http://127.0.0.1:48930'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  success(res, {
    status: 'ok',
    timestamp: dayjs().toISOString(),
    uptime: process.uptime(),
    date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/worker', workerRouter);
app.use('/api/enterprise', enterpriseRouter);
app.use('/api/job', jobRouter);
app.use('/api/wage', wageRouter);
app.use('/api/risk', riskRouter);
app.use('/api/service', serviceRouter);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.path}`,
  });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误: ' + (err?.message || 'Unknown error'),
  });
});

app.listen(PORT, HOST, () => {
  console.log('========================================');
  console.log(` 🏗️  建筑劳务协同平台 - 后端服务`);
  console.log(`========================================`);
  console.log(` 🚀 服务地址: http://${HOST}:${PORT}`);
  console.log(` 🏥 健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(` 📅 启动时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
  console.log('========================================');
});
