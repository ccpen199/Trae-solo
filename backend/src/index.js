import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env'), override: true });

import express from 'express';
import cors from 'cors';
import { mkdirSync } from 'fs';
import { initDb } from './db/init.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import chatRoutes from './routes/chat.js';
import settlementRoutes from './routes/settlements.js';
import riskRoutes from './routes/risk.js';
import universityRoutes from './routes/university.js';
import adminRoutes from './routes/admin.js';
import { error } from './utils/response.js';

const PORT = process.env.BACKEND_PORT || 58769;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 48769;

const uploadDir = resolve(__dirname, '..', 'data', 'uploads');
mkdirSync(uploadDir, { recursive: true });

const app = express();

app.use(cors({
  origin: [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json(error('接口不存在', 404));
});

app.use((err, req, res, _next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json(error(`文件上传错误: ${err.message}`));
  }
  console.error(err);
  res.status(500).json(error('服务器内部错误', 500));
});

initDb(process.env.SQLITE_DB_PATH);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
});
