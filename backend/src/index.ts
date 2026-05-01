import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { config } from './config';

dotenv.config();

const app = express();
const PORT = config.PORT || 8472;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
  },
});
app.use('/api', limiter);

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  分销佣金系统后端服务启动成功`);
  console.log(`  端口: ${PORT}`);
  console.log(`  API 地址: http://localhost:${PORT}/api/v1`);
  console.log(`  健康检查: http://localhost:${PORT}/api/v1/health`);
  console.log(`=========================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('未处理的 Promise 拒绝:', err);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});
