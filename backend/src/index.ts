import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { initDatabase } from './database';
import authRoutes from './routes/auth';
import clueRoutes from './routes/clues';
import statsRoutes from './routes/stats';
import testRoutes from './routes/tests';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '58872');

initDatabase();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
  referrerPolicy: false,
  strictTransportSecurity: false,
  xContentTypeOptions: false,
  xDnsPrefetchControl: false,
  xDownloadOptions: false,
  xFrameOptions: false,
  xPermittedCrossDomainPolicies: false,
  xPoweredBy: false,
  xXssProtection: false
}));

app.use(cors({
  origin: ['http://127.0.0.1:48872', 'http://localhost:48872', 'http://127.0.0.1:49872', 'http://localhost:49872'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  const frontendPort = process.env.FRONTEND_PORT || '48872';
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=http://127.0.0.1:${frontendPort}/">
  <title>跳转中...</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
  <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
    <h2 style="color: #1890ff; margin-bottom: 16px;">案件线索管理系统</h2>
    <p style="color: #666; margin-bottom: 20px;">正在跳转到前端页面...</p>
    <p style="color: #999; font-size: 14px;">如果没有自动跳转，请点击：</p>
    <a href="http://127.0.0.1:${frontendPort}/" style="display: inline-block; padding: 10px 24px; background: #1890ff; color: white; text-decoration: none; border-radius: 4px;">进入系统</a>
    <p style="margin-top: 20px; font-size: 12px; color: #ccc;">当前端口：${PORT}（后端 API）</p>
  </div>
</body>
</html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/clues', clueRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tests', testRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});

export default app;
