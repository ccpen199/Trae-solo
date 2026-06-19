import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDB } from './models/database';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { deviceMiddleware } from './middleware/auth';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import coinRoutes from './routes/coinRoutes';
import withdrawalRoutes from './routes/withdrawalRoutes';
import adRoutes from './routes/adRoutes';
import adminRoutes from './routes/adminRoutes';
import { success } from './utils/response';

const app = express();

initDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(deviceMiddleware);
app.use(rateLimitMiddleware);

app.get('/health', (req, res) => {
  res.json(success({ status: 'ok', timestamp: new Date().toISOString() }));
});

app.get('/api/health', (req, res) => {
  res.json(success({ status: 'ok', timestamp: new Date().toISOString() }));
});

app.use('/api/user', userRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/coin', coinRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/ad', adRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ code: -1, message: '服务器内部错误' });
});

app.listen(config.port, config.host, () => {
  console.log(`Growth Platform Server running on http://${config.host}:${config.port}`);
  console.log(`Health check: http://${config.host}:${config.port}/api/health`);
  console.log(`Admin API: http://${config.host}:${config.port}/api/admin`);
  console.log(`User API: http://${config.host}:${config.port}/api/user`);
});

export default app;
