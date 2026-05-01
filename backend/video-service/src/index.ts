import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { logger } from './utils/logger';
import { testConnection, syncDatabase } from './database';
import { initRabbitMQ, initMinio } from './services/videoService';
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
          'http://localhost:9876',
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

app.use(routes);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.context?.requestId || 'unknown',
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
    requestId: req.context?.requestId || 'unknown',
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
    logger.info('Starting Video Service...', {
      port: config.port,
      nodeEnv: config.nodeEnv,
      logLevel: config.logLevel,
    });

    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Database connection failed, exiting...');
      process.exit(1);
    }

    await syncDatabase();
    await initRabbitMQ();
    await initMinio();

    app.listen(config.port, () => {
      logger.info('Video Service started successfully', {
        port: config.port,
        url: `http://localhost:${config.port}`,
      });
    });
  } catch (error) {
    logger.error('Failed to start Video Service', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();
