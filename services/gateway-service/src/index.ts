import express, { Application } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import { config, logger, errorHandler, notFoundHandler, requestLogger } from '@sms-platform/shared';
import * as net from 'net';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

const serviceRoutes: { [key: string]: { target: string; options?: Options } } = {
  '/api/auth': {
    target: `http://localhost:${config.services.template.port}`,
  },
  '/api/templates': {
    target: `http://localhost:${config.services.template.port}`,
  },
  '/api/sms': {
    target: `http://localhost:${config.services.smsSender.port}`,
  },
  '/api/providers': {
    target: `http://localhost:${config.services.routing.port}`,
  },
  '/api/routing': {
    target: `http://localhost:${config.services.routing.port}`,
  },
  '/api/frequency': {
    target: `http://localhost:${config.services.frequency.port}`,
  },
  '/api/receipt': {
    target: `http://localhost:${config.services.receipt.port}`,
  },
  '/api/compliance': {
    target: `http://localhost:${config.services.compliance.port}`,
  },
  '/api/audit': {
    target: `http://localhost:${config.services.audit.port}`,
  },
  '/api/finance': {
    target: `http://localhost:${config.services.finance.port}`,
  },
};

for (const [path, route] of Object.entries(serviceRoutes)) {
  const proxyOptions: Options = {
    target: route.target,
    changeOrigin: true,
    pathRewrite: {
      [`^${path}`]: path,
    },
    logLevel: config.env === 'development' ? 'debug' : 'silent',
    onProxyReq: (proxyReq, req, res) => {
      logger.debug(`Proxying request: ${req.method} ${req.path} -> ${route.target}${req.path}`);
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error: ${err.message}`);
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: '服务暂时不可用',
        },
        timestamp: new Date().toISOString(),
      });
    },
    ...route.options,
  };

  app.use(path, createProxyMiddleware(proxyOptions));
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'gateway-service',
    },
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort(preferredPort: number, fallbackRange: number[] = [9820, 9829]): Promise<number> {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }

  for (let port = fallbackRange[0]; port <= fallbackRange[1]; port++) {
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
  const preferredPort = config.services.gateway.port;
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
    logger.info(`  网关服务启动成功`);
    logger.info(`  监听端口: ${actualPort}`);
    logger.info(`  环境: ${config.env}`);
    logger.info(`  启动时间: ${new Date().toISOString()}`);
    logger.info(`=================================================`);
    logger.info(`  可用API路径:`);
    Object.keys(serviceRoutes).forEach((path) => {
      logger.info(`  - ${path}`);
    });
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
