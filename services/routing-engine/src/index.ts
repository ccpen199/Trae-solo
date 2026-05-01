import express, { Application, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger, authMiddleware, asyncHandler, AuthenticatedRequest, query, execute, generateCode, ApiResponse, RoutingResult, Provider } from '@sms-platform/shared';
import * as net from 'net';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const routingRouter = Router();

routingRouter.post(
  '/select',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { templateType, phoneNumber, variables } = req.body;

    const providers = await query(`
      SELECT id, provider_code, provider_name, priority, price_per_sms, supported_template_types, status
      FROM providers
      WHERE status = 1
      ORDER BY priority DESC
    `);

    if (providers.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NO_AVAILABLE_PROVIDER',
          message: '没有可用的短信通道',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(503).json(response);
      return;
    }

    const routingRules = await query(`
      SELECT * FROM routing_rules
      WHERE status = 1
      ORDER BY priority DESC
    `);

    let selectedProvider: Provider | null = null;
    let matchedRule: string | undefined;

    for (const rule of routingRules) {
      let matches = true;

      if (rule.template_type && rule.template_type !== templateType) {
        matches = false;
      }

      if (rule.phone_prefix && phoneNumber && !phoneNumber.startsWith(rule.phone_prefix)) {
        matches = false;
      }

      if (matches && rule.target_provider_id) {
        const provider = providers.find((p: any) => p.id === rule.target_provider_id);
        if (provider) {
          const supportedTypes = JSON.parse(provider.supported_template_types || '[]');
          if (supportedTypes.includes(templateType) || supportedTypes.length === 0) {
            selectedProvider = provider;
            matchedRule = rule.rule_code;
            break;
          }
        }
      }
    }

    if (!selectedProvider) {
      for (const provider of providers) {
        const supportedTypes = JSON.parse(provider.supported_template_types || '[]');
        if (supportedTypes.includes(templateType) || supportedTypes.length === 0) {
          selectedProvider = provider;
          break;
        }
      }
    }

    if (!selectedProvider) {
      selectedProvider = providers[0];
    }

    const result: RoutingResult = {
      providerId: selectedProvider.id,
      providerCode: selectedProvider.provider_code,
      providerName: selectedProvider.provider_name,
      pricePerSms: selectedProvider.price_per_sms,
      matchedRule,
    };

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

routingRouter.get(
  '/providers',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const providers = await query(`
      SELECT id, provider_code, provider_name, description, status, priority, price_per_sms, supported_template_types, created_at
      FROM providers
      ORDER BY priority DESC
    `);

    const response: ApiResponse = {
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
          supportedTemplateTypes: JSON.parse(p.supported_template_types || '[]'),
          createdAt: p.created_at,
        })),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

routingRouter.get(
  '/rules',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const rules = await query(`
      SELECT * FROM routing_rules
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

app.use('/api/routing', routingRouter);
app.use('/api/providers', routingRouter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'routing-engine',
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
  for (let port = 9840; port <= 9850; port++) {
    if (port !== preferredPort && await isPortAvailable(port)) {
      return port;
    }
  }
  return 0;
}

async function startServer() {
  const preferredPort = config.services.routing.port;
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
    logger.info(`  路由引擎启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`=================================================`);
  });
}

startServer().catch((err) => {
  logger.error('服务启动失败:', err);
  process.exit(1);
});
