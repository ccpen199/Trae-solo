import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import packageRoutes from './routes/packages';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 7011;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 7012;

app.use(cors({
  origin: [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'express-delivery-backend'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  快递末端派件系统 - 后端服务已启动`);
  console.log(`========================================`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  API 前缀: http://localhost:${PORT}/api`);
  console.log(`========================================\n`);
  console.log('默认测试账号:');
  console.log('  - 管理员: admin / 123456');
  console.log('  - 快递员: courier1 / 123456');
  console.log('  - 快递员: courier2 / 123456');
  console.log('  - 客服: cs1 / 123456');
  console.log(`\n========================================\n`);
});
