import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './utils/database';
import authRoutes from './routes/auth';
import planetRoutes from './routes/planet';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '54875');

app.use(cors({
  origin: ['http://127.0.0.1:44875', 'http://localhost:44875'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/planet', planetRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const startServer = () => {
  initDatabase();
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 星球后端服务已启动: http://127.0.0.1:${PORT}`);
    console.log(`📊 API 健康检查: http://127.0.0.1:${PORT}/api/health`);
  });
};

startServer();
