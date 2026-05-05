import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import './database.js';

import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import commonRoutes from './routes/common.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 20770;

app.use(cors({
  origin: ['http://localhost:30770', 'http://127.0.0.1:30770'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OA费用报销审批系统服务正常', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/common', commonRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  OA费用报销审批系统后端服务已启动`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API前缀: /api`);
  console.log(`==================================================`);
});
