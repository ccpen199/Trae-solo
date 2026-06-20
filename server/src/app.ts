import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import config from './config';
import { initDatabase, getDb } from './db';
import { error, asyncHandler, AuthRequest, authRequired } from './middleware';

import authRoutes from './routes/auth';
import applyRoutes from './routes/apply';
import signingRoutes from './routes/signing';
import trackingRoutes from './routes/tracking';
import adminRoutes from './routes/admin';

const app = express();

app.use(helmet({ contentSecurityPolicy: config.server.env === 'production' ? undefined : false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const accessLog = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
app.use(morgan(config.server.env === 'development' ? 'dev' : 'combined', {
  stream: config.server.env === 'development' ? undefined : accessLog
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.server.env === 'development' ? 10000 : 120,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
app.use('/api/', apiLimiter);

app.get('/api/health', asyncHandler(async (_req, res) => {
  const db = getDb();
  const ok = db.prepare('SELECT 1 as v').get();
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      db: !!ok,
      version: '1.0.0',
      env: config.server.env
    }
  });
}));

app.use('/api/auth', authRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/signing', signingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/me/audit-log', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM operation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`).all(req.userId);
  res.json({ code: 0, message: 'success', data: rows });
}));

app.use((req: express.Request, res: express.Response) => {
  error(res, `接口不存在: ${req.method} ${req.originalUrl}`, 404, 404);
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.stack || err);
  error(res, err.message || '服务器内部错误', 500, 500);
});

const start = () => {
  initDatabase();
  app.listen(config.server.port, config.server.host, () => {
    console.log(`\n🚀 省级市场监管电子政务 API 服务已启动`);
    console.log(`📍 地址: http://${config.server.host}:${config.server.port}`);
    console.log(`🔍 健康检查: http://${config.server.host}:${config.server.port}/api/health`);
    console.log(`📚 API 前缀: /api/  (auth, apply, signing, tracking, admin)`);
    console.log(`🗄️  数据库: ${config.db.path}\n`);
  });
};

if (require.main === module) start();

export default app;
