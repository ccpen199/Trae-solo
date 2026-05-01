import { Router, Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { config } from '../config';
import { authenticateToken, checkRole } from '../middleware/auth';
import { rateLimitMiddleware, createCustomRateLimiter } from '../middleware/rateLimiter';
import { auditMiddleware } from '../middleware/audit';
import { ServiceConfig, ApiResponse } from '../types';
import { logger } from '../utils/logger';

const router = Router();

const healthCheckRouter = Router();
healthCheckRouter.get('/', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string; service: string }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };
  res.json(response);
});

router.use('/api/health', healthCheckRouter);

const createServiceProxy = (serviceConfig: ServiceConfig) => {
  const serviceRouter = Router();

  const proxyOptions: Options = {
    target: serviceConfig.url,
    changeOrigin: true,
    pathRewrite: {
      [`^${serviceConfig.path}`]: '',
    },
    logProvider: () => logger,
    logLevel: config.nodeEnv === 'development' ? 'debug' : 'warn',
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-Username', req.user.username);
      }
      proxyReq.setHeader('X-Request-Id', req.context.requestId);
      proxyReq.setHeader('X-Session-Id', req.context.sessionId || '');
      proxyReq.setHeader('X-Device-Id', req.context.deviceId || '');
      proxyReq.setHeader('X-Real-IP', req.context.ipAddress);
    },
    onError: (err, req, res) => {
      logger.error('Proxy error', {
        error: err.message,
        service: serviceConfig.name,
        path: req.path,
        requestId: req.context.requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: `${serviceConfig.name} is temporarily unavailable`,
          details: {
            service: serviceConfig.name,
          },
        },
        timestamp: new Date().toISOString(),
        requestId: (req as Request).context.requestId,
      };

      if (!res.headersSent) {
        res.status(503).json(response);
      }
    },
  };

  if (serviceConfig.requiredAuth) {
    serviceRouter.use(authenticateToken);
    if (serviceConfig.allowedRoles) {
      serviceRouter.use(checkRole(serviceConfig.allowedRoles));
    }
  }

  serviceRouter.use(rateLimitMiddleware);
  serviceRouter.use(auditMiddleware(serviceConfig.name));

  if (serviceConfig.path === '/api/videos' && serviceConfig.allowedRoles?.includes('creator')) {
    serviceRouter.post(
      '/upload',
      createCustomRateLimiter({
        maxRequests: 5,
        windowSeconds: 60,
        keyPrefix: 'rate_limit:video_upload',
      })
    );
  }

  serviceRouter.use(createProxyMiddleware(proxyOptions));

  return serviceRouter;
};

Object.values(config.services).forEach((serviceConfig) => {
  router.use(serviceConfig.path, createServiceProxy(serviceConfig));
  logger.info(`Service proxy configured`, {
    name: serviceConfig.name,
    path: serviceConfig.path,
    target: serviceConfig.url,
    requiredAuth: serviceConfig.requiredAuth,
    allowedRoles: serviceConfig.allowedRoles,
  });
});

router.use('*', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested resource ${req.path} was not found`,
      details: {
        method: req.method,
        path: req.path,
      },
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };

  res.status(404).json(response);
});

export default router;
