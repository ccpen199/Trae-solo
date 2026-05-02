import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config';
import { connectDB } from './database/sequelize';
import routes from './routes';
import { notFound, errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: env.NODE_ENV === 'production' 
      ? ['http://localhost:29876', 'http://127.0.0.1:29876']
      : '*',
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 100,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/v1', routes);

app.use(notFound);

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('数据库连接成功');

    const port = env.PORT;
    app.listen(port, () => {
      console.log(`服务器运行在端口 ${port}`);
      console.log(`环境: ${env.NODE_ENV}`);
      console.log(`API 地址: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
