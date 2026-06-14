import express from 'express';
import cors from 'cors';
import { config } from './config';
import { getDb, initTables } from './database';
import { loggerMiddleware } from './middleware/logger';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'running', timestamp: new Date().toISOString() } });
});

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ code: 10404, message: '接口不存在', data: null });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ code: 10500, message: '服务器内部错误', data: null });
});

function start() {
  const db = getDb();
  initTables();
  console.log('数据库表初始化完成');

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    console.log('检测到空数据库，请运行 npm run seed 初始化种子数据');
  }

  app.listen(config.port, config.host, () => {
    console.log(`快递末端作业平台服务已启动: http://${config.host}:${config.port}`);
    console.log(`健康检查: http://${config.host}:${config.port}/health`);
    console.log(`API根路径: http://${config.host}:${config.port}/api`);
  });
}

start();
