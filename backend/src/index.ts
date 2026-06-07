import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { initDatabase } from './database';
import authRoutes from './routes/auth';
import cityRoutes from './routes/cities';
import postRoutes from './routes/posts';
import merchantRoutes from './routes/merchants';
import socialRoutes from './routes/social';
import adminRoutes from './routes/admin';

const app = express();
const PORT = config.port;
const HOST = config.host;

app.use(cors({
  origin: `http://127.0.0.1:49015`,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`API base: http://${HOST}:${PORT}/api`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});

export default app;
