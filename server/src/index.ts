import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import config from './config';
import { initializeDatabase } from './database/dataSource';
import { PortManager } from './utils/portManager';
import { couponStateMachine } from './engines/couponStateEngine';
import { promotionStackingEngine } from './engines/promotionStackingEngine';
import { budgetGuardEngine } from './engines/budgetGuardEngine';
import { traceMiddleware, errorHandler, notFoundHandler, rateLimitMiddleware } from './middleware';

import authRoutes from './routes/auth';
import couponRoutes from './routes/coupons';
import orderRoutes from './routes/orders';
import financeRoutes from './routes/finance';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function bootstrap() {
  const app = express();
  
  app.use(helmet());
  app.use(cors({
    origin: [
      'http://localhost:28080',
      'http://127.0.0.1:28080',
      'http://localhost:28081',
      'http://127.0.0.1:28081'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
    exposedHeaders: ['X-Trace-Id']
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  app.use(rateLimitMiddleware(1000, 60000));
  app.use(traceMiddleware);
  
  app.use('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'coupon-marketing-server',
      version: '1.0.0'
    });
  });
  
  const apiPrefix = config.server.apiPrefix;
  
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/coupons`, couponRoutes);
  app.use(`${apiPrefix}/orders`, orderRoutes);
  app.use(`${apiPrefix}/finance`, financeRoutes);
  
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  console.log('Initializing database connection...');
  await initializeDatabase();
  console.log('Database initialized successfully');
  
  console.log('Initializing engines...');
  await couponStateMachine.initialize();
  await promotionStackingEngine.initialize();
  console.log('Engines initialized successfully');
  
  const portResult = await PortManager.validateAndGetPort(config.server.port);
  
  if (!portResult.available) {
    console.warn(portResult.message);
    if (portResult.suggestedPort) {
      console.log(`Using suggested port: ${portResult.suggestedPort}`);
      config.server.port = portResult.suggestedPort;
    } else {
      throw new Error('No available ports found');
    }
  }
  
  const server = app.listen(config.server.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    优惠券营销系统 - 后端服务                     ║
╠══════════════════════════════════════════════════════════════╣
║  服务状态: 已启动                                               ║
║  运行端口: ${String(config.server.port).padEnd(50)}║
║  API前缀:  ${apiPrefix.padEnd(50)}║
║  环境:     ${config.server.nodeEnv.padEnd(50)}║
╠══════════════════════════════════════════════════════════════╣
║  已加载引擎:                                                    ║
║    ✓ Coupon-State 状态机引擎                                    ║
║    ✓ Promotion-Stacking 叠加引擎                                ║
║    ✓ Anti-Fraud 防作弊引擎                                      ║
║    ✓ Budget-Guard 预算引擎                                      ║
╠══════════════════════════════════════════════════════════════╣
║  默认账号:                                                       ║
║    Admin:    admin / Admin@123                                 ║
║    Operator: operator / Operator@123                           ║
║    Merchant: merchant / Merchant@123                           ║
║    Finance:  finance / Finance@123                             ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
  
  const gracefulShutdown = () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    setTimeout(() => {
      console.error('Forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
