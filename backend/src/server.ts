import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database/init';
import authRoutes from './routes/auth';
import poiRoutes from './routes/pois';
import providerRoutes from './routes/providers';
import demandRoutes from './routes/demands';
import statsRoutes from './routes/stats';
import gridRoutes from './routes/grids';
import announcementRoutes from './routes/announcements';
import dialectRoutes from './routes/dialect';
import recommendRoutes from './routes/recommend';

const app = express();
const PORT = parseInt(process.env.PORT || '58831');
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors({
  origin: ['http://127.0.0.1:48831', 'http://localhost:48831'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化数据库
initDatabase().then(() => {
  console.log('数据库初始化完成');
}).catch(err => {
  console.error('数据库初始化失败:', err);
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '县域本地生活服务API运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/pois', poiRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/grids', gridRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dialect', dialectRoutes);
app.use('/api/recommend', recommendRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在',
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`========================================`);
  console.log(`  县域本地生活服务后端服务已启动`);
  console.log(`  地址: http://${HOST}:${PORT}`);
  console.log(`  健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`========================================`);
});

export default app;
