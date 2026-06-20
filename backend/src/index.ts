import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db';
import routes from './routes';

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDb();

app.use(`${API_PREFIX}`, routes);

const getHealthPayload = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  host: HOST,
  port: PORT,
  apiPrefix: API_PREFIX,
});

app.get('/health', (req, res) => {
  res.json(getHealthPayload());
});

app.get('/api/health', (req, res) => {
  res.json(getHealthPayload());
});

app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json(getHealthPayload());
});

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, HOST, () => {
  console.log(`
  🚀 云南省全域招聘公共服务平台
  ===============================
  📡 后端服务已启动: http://${HOST}:${PORT}
  🌐 API 前缀: ${API_PREFIX}
  📊 健康检查: http://${HOST}:${PORT}/api/health
  ===============================
  `);
});
