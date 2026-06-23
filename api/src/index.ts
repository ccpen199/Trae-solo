import express from 'express';
import cors from 'cors';
import db from '@/db/index.js';
import seedDatabase from '@/mock/seedData.js';
import { corsMiddleware } from '@/middleware/cors.js';
import routes from '@/routes/index.js';

const app = express();
const PORT = 3001;

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

seedDatabase();

app.listen(PORT, () => {
  console.log(`工会服务平台 API 服务器已启动，监听端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
});

export default app;
