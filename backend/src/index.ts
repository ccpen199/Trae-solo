import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './database';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import photoRoutes from './routes/photos';
import lossRoutes from './routes/loss';
import reviewRoutes from './routes/review';

const app = express();
const PORT = process.env.BACKEND_PORT || 58806;

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

initDatabase();

app.use(cors({
  origin: [
    `http://127.0.0.1:${process.env.FRONTEND_PORT || 48806}`,
    `http://localhost:${process.env.FRONTEND_PORT || 48806}`
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/loss', lossRoutes);
app.use('/api/review', reviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`🚀 后端服务已启动: http://127.0.0.1:${PORT}`);
  console.log(`📁 上传目录: ${uploadDir}`);
});
