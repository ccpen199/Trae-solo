import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { waybillRouter, systemRouter, authRouter } from './routes';
import { errorHandler, notFoundHandler, authMiddleware } from './middleware';
import { AuthController } from './controllers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 11169;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:11691';

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:11691', 'http://127.0.0.1:11691'],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '航空货运管理系统 API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /api/system/health',
      waybills: 'GET /api/waybills/list',
      dashboard: 'GET /api/system/dashboard',
      login: 'POST /api/auth/login',
    },
  });
});

app.use('/api/auth', authRouter);

app.use('/api/waybills', authMiddleware, waybillRouter);
app.use('/api/system', authMiddleware, systemRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功');

    await AuthController.ensurePasswordHash();
    console.log('✅ 用户密码哈希初始化完成');

    app.listen(PORT, () => {
      console.log('========================================');
      console.log('🚀 航空货运管理系统后端服务已启动');
      console.log('========================================');
      console.log(`📌 服务地址: http://localhost:${PORT}`);
      console.log(`📌 API 前缀: http://localhost:${PORT}/api`);
      console.log(`📌 前端地址: ${FRONTEND_URL}`);
      console.log(`📌 数据库: SQLite (data/app.sqlite)`);
      console.log('========================================');
      console.log('📋 可用接口:');
      console.log('   - POST /api/auth/login         登录');
      console.log('   - GET  /api/auth/me            获取当前用户');
      console.log('   - GET  /api/system/health      健康检查');
      console.log('   - GET  /api/system/dashboard   仪表盘统计');
      console.log('   - GET  /api/waybills/list      运单列表');
      console.log('   - POST /api/waybills/draft     创建订舱草稿');
      console.log('========================================');
      console.log('👤 默认用户 (密码: 123456):');
      console.log('   - admin     管理员');
      console.log('   - forwarder 货代');
      console.log('   - airline   航司');
      console.log('   - warehouse 仓库');
      console.log('   - security  安检');
      console.log('   - consignee 收货人');
      console.log('========================================');
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

startServer();
