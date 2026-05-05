import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { initializeDatabase } from './lib/prisma';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';
import { error } from './utils/response';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
});
app.use(limiter);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

app.use('*', (req, res) => {
  return error(res, '接口不存在', 404);
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('未处理的错误:', err);
  return error(res, '服务器内部错误', 500);
});

async function startServer() {
  try {
    console.log('初始化数据库...');
    await initializeDatabase();
    console.log('数据库初始化完成');

    app.listen(config.server.port, () => {
      console.log(`======================================`);
      console.log(`  用户管理系统后端服务已启动`);
      console.log(`  环境: ${config.server.nodeEnv}`);
      console.log(`  地址: http://localhost:${config.server.port}`);
      console.log(`  API: http://localhost:${config.server.port}/api`);
      console.log(`======================================`);
    });
  } catch (err) {
    console.error('启动服务器失败:', err);
    process.exit(1);
  }
}

startServer();
