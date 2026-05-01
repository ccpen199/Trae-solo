import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { contextMiddleware, responseTimeMiddleware } from './middleware/context';
import routes from './routes';
import { logger } from './utils/logger';
import { processAuditLogs } from './middleware/audit';
import { ApiResponse } from './types';
import { Request, Response, NextFunction } from 'express';

const app = express();

app.set('trust proxy', true);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    frameguard: {
      action: 'deny',
    },
  })
);

app.use(
  cors({
    origin: config.nodeEnv === 'production'
      ? ['https://*.yourdomain.com']
      : [
          'http://localhost:9884',
          'http://localhost:9885',
          'http://localhost:9886',
          'http://localhost:9887',
        ],
    credentials: true,
    exposedHeaders: ['X-Request-ID', 'X-Response-Time'],
  })
);

app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(contextMiddleware);
app.use(responseTimeMiddleware);

app.use(routes);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.context.requestId,
    path: req.path,
    method: req.method,
  });

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };

  res.status(500).json(response);
});

process.on('unhandledRejection', (reason: Error | unknown) => {
  logger.error('Unhandled rejection', {
    error: reason instanceof Error ? reason.message : 'Unknown error',
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

const startServer = async () => {
  try {
    logger.info('Starting API Gateway...', {
      port: config.port,
      nodeEnv: config.nodeEnv,
      logLevel: config.logLevel,
    });

    processAuditLogs().catch((error) => {
      logger.error('Failed to start audit log processor', {
        error: error.message,
      });
    });

    app.listen(config.port, () => {
      logger.info('API Gateway started successfully', {
        port: config.port,
        url: `http://localhost:${config.port}`,
      });

      logger.info('Configured services:');
      Object.entries(config.services).forEach(([name, service]) => {
        logger.info(`  - ${name}: ${service.path} -> ${service.url}`);
      });
    });
  } catch (error) {
    logger.error('Failed to start API Gateway', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();
