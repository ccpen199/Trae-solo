import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase, seedDatabase } from './db/schema';
import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';
import userRoutes from './routes/user';
import transactionRoutes from './routes/transactions';
import agentRoutes from './routes/agent';
import developerRoutes from './routes/developer';
import ownerRoutes from './routes/owner';
import marketRoutes from './routes/market';
import governanceRoutes from './routes/governance';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 59283;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:49283',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();
seedDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '房产交易平台后端服务运行正常', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/governance', governanceRoutes);

app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: '服务器内部错误', error: err.message });
});

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`后端服务已启动: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});

export default app;
