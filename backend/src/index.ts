import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config, isDevelopment } from './config';
import { logger } from './lib/logger';
import { errorMiddleware } from './middleware';

import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaigns.routes';
import templateRoutes from './routes/templates.routes';
import audienceRoutes from './routes/audiences.routes';
import trackingRoutes from './routes/tracking.routes';
import sendRoutes from './routes/send.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.set('trust proxy', true);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: isDevelopment ? true : [
    `http://localhost:47292`,
    `http://localhost:47297`,
    `http://localhost:47299`,
  ],
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get('/health', async (_req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    env: config.env,
    port: config.port,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/audiences', audienceRoutes);
app.use('/api/send', sendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/track', trackingRoutes);
app.use('/track', trackingRoutes);

app.get('/api/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Email Marketing System API',
      version: '1.0.0',
      environment: config.env,
      features: [
        'Marketing Automation Engine',
        'Template Dynamic Engine',
        'Analytics Tracker Engine',
        'Deliverability Optimization Engine',
      ],
      engines: {
        automation: {
          name: 'Marketing-Automation 自动化引擎',
          features: [
            '营销旅程编排',
            'A/B分支自动执行',
            '实时进度展示',
          ],
        },
        template: {
          name: 'Template-Dynamic 动态渲染引擎',
          features: [
            '实时替换模板占位符',
            '用户画像数据渲染',
            '追踪链接注入',
            '渲染依据说明',
          ],
        },
        tracker: {
          name: 'Analytics-Tracker 点击追踪引擎',
          features: [
            '点击动作捕获',
            '状态同步至数据看板',
            '送达率/退信率/点击率统计',
            '退订自动处理',
            '风险标记',
          ],
        },
        deliverability: {
          name: 'Deliverability-Opt 发送优化引擎',
          features: [
            '退信分析',
            '发件人声誉监控',
            '用户活跃度评分',
            '发送速率控制',
            '最佳发送时间推荐',
          ],
        },
      },
      coreWorkflows: {
        '受众筛选 → 任务批次生成': '运营在前端筛选受众，后端拉取用户画像并生成任务批次，状态置为"待发送"',
        '自动化引擎 → A/B分支': '利用"自动化引擎"编排营销旅程，后端根据用户是否打开邮件自动执行A/B分支，前端实时展示旅程执行进度',
        '动态渲染 → 点击追踪': '后端按画像实时替换模板占位符，执行动态渲染，发送后通过"追踪引擎"捕获点击动作，状态同步至数据看板',
        '实时统计 → 退订处理': '后端实时记录送达率、退信率、点击率，用户在前端点击退订，后端自动封禁对应权限并在前端标记风险',
        '多级审核 → 永久存档': '邮件内容支持多级审核，审核历史、发送轨迹、点击日志永久存档',
        'ROI报表 → 全量审计': '后端定期生成营销ROI报表，所有营销活动、发送记录、用户反馈都能全量审计',
      },
      multiEnv: {
        ports: {
          '后端开发': 47291,
          '前端开发': 47292,
          '预览后端': 47296,
          '预览前端': 47297,
          '测试后端': 47298,
          '测试前端': 47299,
          'Redis': 47293,
          'PostgreSQL': 47294,
          'Mock邮件服务': 47295,
        },
        isolation: '各环境独立运行，端口互不冲突',
      },
    },
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API端点不存在',
  });
});

app.use(errorMiddleware);

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Email Marketing System API running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api/info`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, server };
