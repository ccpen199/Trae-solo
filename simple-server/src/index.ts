import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './logger';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';
import * as net from 'net';

import { authRouter } from './routes/auth';
import { templateRouter } from './routes/templates';
import { smsRouter } from './routes/sms';
import { financeRouter } from './routes/finance';
import { auditRouter } from './routes/audit';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

app.use('/api/auth', authRouter);
app.use('/api/templates', templateRouter);
app.use('/api/sms', smsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/audit', auditRouter);

app.get('/api/providers', (req, res) => {
  const db = require('./database').getDatabase();
  const providers = db.prepare('SELECT * FROM providers ORDER BY priority DESC').all();
  
  res.json({
    success: true,
    data: {
      list: providers.map((p: any) => ({
        id: p.id,
        providerCode: p.provider_code,
        providerName: p.provider_name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        pricePerSms: p.price_per_sms,
        supportedTemplateTypes: p.supported_template_types ? JSON.parse(p.supported_template_types) : [],
        createdAt: p.created_at,
      })),
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/frequency/rules', (req, res) => {
  const db = require('./database').getDatabase();
  const rules = db.prepare('SELECT * FROM frequency_rules ORDER BY priority DESC').all();
  
  res.json({
    success: true,
    data: { list: rules },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/compliance/rules', (req, res) => {
  const db = require('./database').getDatabase();
  const rules = db.prepare('SELECT * FROM compliance_rules ORDER BY priority DESC').all();
  
  res.json({
    success: true,
    data: { list: rules },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/routing/rules', (req, res) => {
  const db = require('./database').getDatabase();
  const rules = db.prepare('SELECT * FROM routing_rules ORDER BY priority DESC').all();
  
  res.json({
    success: true,
    data: { list: rules },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'sms-platform-simple',
    },
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }
  
  for (let port = 9820; port <= 9850; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  
  const randomPort = Math.floor(Math.random() * 10000) + 50000;
  if (await isPortAvailable(randomPort)) {
    return randomPort;
  }
  
  return 0;
}

async function startServer() {
  logger.info('正在初始化数据库...');
  const { getDatabase } = require('./database');
  getDatabase();
  
  const preferredPort = config.port;
  const actualPort = await findAvailablePort(preferredPort);

  if (actualPort === 0) {
    logger.error('无法找到可用的端口，请检查网络配置');
    process.exit(1);
  }

  if (actualPort !== preferredPort) {
    logger.warn(`端口 ${preferredPort} 已被占用，自动切换到端口 ${actualPort}`);
  }

  app.listen(actualPort, () => {
    logger.info(`=================================================`);
    logger.info(`  短信营销与通知平台启动成功`);
    logger.info(`=================================================`);
    logger.info(`  服务类型: 简化版（单服务 + SQLite）`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`  环境: ${config.env}`);
    logger.info(`  启动时间: ${new Date().toISOString()}`);
    logger.info(`=================================================`);
    logger.info(`  可用API路径:`);
    logger.info(`  - POST   /api/auth/login          - 登录`);
    logger.info(`  - GET    /api/auth/me             - 获取当前用户`);
    logger.info(`  - GET    /api/templates            - 模板列表`);
    logger.info(`  - POST   /api/templates            - 创建模板`);
    logger.info(`  - POST   /api/templates/:id/activate - 激活模板`);
    logger.info(`  - POST   /api/sms/send             - 发送短信`);
    logger.info(`  - GET    /api/sms/tasks            - 发送任务列表`);
    logger.info(`  - GET    /api/sms/records          - 发送记录`);
    logger.info(`  - GET    /api/finance/balance      - 账户余额`);
    logger.info(`  - POST   /api/finance/recharge     - 充值`);
    logger.info(`  - GET    /api/finance/reports/monthly - 月度报表`);
    logger.info(`  - GET    /api/audit                - 审计日志`);
    logger.info(`=================================================`);
    logger.info(`  测试账号：`);
    logger.info(`  - 运营人员: operator / password123`);
    logger.info(`  - 开发者  : developer / password123`);
    logger.info(`  - 财务人员: finance / password123`);
    logger.info(`  - 管理员  : admin / password123`);
    logger.info(`=================================================`);
    logger.info(`  前端地址: http://localhost:${actualPort}`);
    logger.info(`  健康检查: http://localhost:${actualPort}/health`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务...');
  process.exit(0);
});
