import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, FrequencyCheckResult, FrequencyRule, getRedisClient, incrementFrequencyCount, getFrequencyCount, addSeconds, getNowDate } from '@sms-platform/shared';
import * as net from 'net';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const frequencyRouter = Router();

frequencyRouter.post(
  '/check',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { phoneNumber, userId, templateType } = req.body;

    const activeRules = await query(`
      SELECT * FROM frequency_rules
      WHERE status = 1
      ORDER BY priority DESC
    `);

    if (activeRules.length === 0) {
      const response: ApiResponse = {
        success: true,
        data: {
          allowed: true,
          remainingCount: 999999,
        },
        timestamp: new Date().toISOString(),
      };
      res.json(response);
      return;
    }

    let overallAllowed = true;
    let interceptReason = '';
    let minRemaining = Number.MAX_SAFE_INTEGER;
    let latestWindowEnd: Date | undefined;

    for (const rule of activeRules) {
      if (rule.template_type && rule.template_type !== templateType) {
        continue;
      }

      let targetValue: string | undefined;
      if (rule.target_type === 'phone' && phoneNumber) {
        targetValue = phoneNumber;
      } else if (rule.target_type === 'user' && userId) {
        targetValue = String(userId);
      } else if (rule.target_type === 'ip') {
        targetValue = req.ip || 'unknown';
      }

      if (!targetValue) {
        continue;
      }

      const currentCount = await getFrequencyCount(rule.target_type, targetValue, rule.time_window);
      const remainingCount = rule.max_count - currentCount;

      if (remainingCount <= 0) {
        overallAllowed = false;
        interceptReason = `频控限制: ${rule.rule_name}，时间窗口: ${rule.time_window}秒，限制: ${rule.max_count}次`;
        break;
      }

      if (remainingCount < minRemaining) {
        minRemaining = remainingCount;
        latestWindowEnd = addSeconds(getNowDate(), rule.time_window);
      }
    }

    if (!overallAllowed) {
      const response: ApiResponse = {
        success: true,
        data: {
          allowed: false,
          remainingCount: 0,
          interceptReason,
          windowEnd: latestWindowEnd,
        } as FrequencyCheckResult,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        allowed: true,
        remainingCount: minRemaining,
        windowEnd: latestWindowEnd,
      } as FrequencyCheckResult,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

frequencyRouter.post(
  '/increment',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { phoneNumber, userId, templateType } = req.body;

    const activeRules = await query(`
      SELECT * FROM frequency_rules
      WHERE status = 1
      ORDER BY priority DESC
    `);

    for (const rule of activeRules) {
      if (rule.template_type && rule.template_type !== templateType) {
        continue;
      }

      let targetValue: string | undefined;
      if (rule.target_type === 'phone' && phoneNumber) {
        targetValue = phoneNumber;
      } else if (rule.target_type === 'user' && userId) {
        targetValue = String(userId);
      } else if (rule.target_type === 'ip') {
        targetValue = req.ip || 'unknown';
      }

      if (!targetValue) {
        continue;
      }

      await incrementFrequencyCount(rule.target_type, targetValue, rule.time_window);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: '频控计数已更新',
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

frequencyRouter.get(
  '/rules',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const rules = await query(`
      SELECT * FROM frequency_rules
      ORDER BY priority DESC
    `);

    const response: ApiResponse = {
      success: true,
      data: {
        list: rules,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

app.use('/api/frequency', frequencyRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'frequency-engine',
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
  for (let port = 9850; port <= 9860; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  return 0;
}

async function startServer() {
  const preferredPort = config.services.frequency.port;
  const actualPort = await findAvailablePort(preferredPort);

  if (actualPort === 0) {
    logger.error('无法找到可用的端口');
    process.exit(1);
  }

  if (actualPort !== preferredPort) {
    logger.warn(`端口 ${preferredPort} 已被占用，自动切换到端口 ${actualPort}`);
  }

  app.listen(actualPort, () => {
    logger.info(`=================================================`);
    logger.info(`  频控引擎启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});
