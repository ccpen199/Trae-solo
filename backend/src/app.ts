import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { AntiReplayProtection } from '@security/antiReplay';
import mqttClient from '@iot/mqttClient';
import apiRoutes from './routes';
import databaseManager from './database';

const xss = require('xss-clean');

class AppServer {
  private app: Application;
  private redisClient: Redis | null = null;
  private server: any = null;
  private isShuttingDown: boolean = false;

  constructor() {
    this.app = express();
  }

  private configureMiddleware(): void {
    this.app.set('trust proxy', 1);

    this.app.use(helmet({
      contentSecurityPolicy: config.server.env === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' as const },
    }));

    this.app.use(cors({
      origin: config.server.env === 'production'
        ? (origin, callback) => {
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      maxAge: 86400,
    }));

    this.app.use(morgan(
      config.server.env === 'production' ? 'combined' : 'dev',
      {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      }
    ));

    this.app.use(express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }));

    this.app.use(express.urlencoded({
      extended: true,
      limit: '10mb',
    }));

    this.app.use(xss());

    this.configureRateLimiting();
  }

  private configureRateLimiting(): void {
    const limiterMessage = {
      success: false,
      message: '请求过于频繁，请稍后再试',
      code: 'TOO_MANY_REQUESTS',
    };

    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: config.server.env === 'production' ? 1000 : 10000,
      standardHeaders: true,
      legacyHeaders: false,
      message: limiterMessage,
      keyGenerator: (req) => {
        return req.ip || 'unknown';
      },
      handler: (_req, res, _next) => {
        logger.warn(`Rate limit exceeded: IP=${_req.ip}`);
        res.status(429).json(limiterMessage);
      },
    });

    this.app.use('/api/v1/', globalLimiter);

    const authLimiterMessage = {
      success: false,
      message: '认证请求过于频繁，请稍后再试',
      code: 'AUTH_RATE_LIMITED',
    };

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: authLimiterMessage,
      handler: (_req, res) => {
        logger.warn(`Auth rate limit exceeded: IP=${_req.ip}`);
        res.status(429).json(authLimiterMessage);
      },
    });

    this.app.use('/api/v1/auth/login', authLimiter);
    this.app.use('/api/v1/auth/send-code', authLimiter);
    this.app.use('/api/v1/iot/device-auth', authLimiter);
  }

  private async connectRedis(): Promise<void> {
    const { host, port, password, db } = config.redis;

    this.redisClient = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 10) {
          logger.error('[Redis] 已达到最大重连次数，停止重连');
          return null;
        }
        const delay = Math.min(times * 1000, 10000);
        logger.warn(`[Redis] 重连中... 第 ${times} 次，延迟 ${delay}ms`);
        return delay;
      },
    });

    this.redisClient.on('connect', () => {
      logger.info(`[Redis] 连接成功: ${host}:${port}, db=${db}`);
    });

    this.redisClient.on('error', (error) => {
      logger.error('[Redis] 连接错误:', error);
    });

    this.redisClient.on('ready', () => {
      logger.info('[Redis] 连接就绪');
    });

    this.redisClient.on('close', () => {
      if (!this.isShuttingDown) {
        logger.warn('[Redis] 连接已关闭');
      }
    });

    this.redisClient.on('reconnecting', () => {
      logger.warn('[Redis] 正在重连...');
    });

    await this.redisClient.connect();
  }

  private async initializeComponents(): Promise<void> {
    AntiReplayProtection.init(this.redisClient!);
    logger.info('[Security] AntiReplayProtection 初始化完成');

    logger.info('[MQTT] MqttClientManager 正在初始化...');
  }

  private configureRoutes(): void {
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: '校园直饮水 IoT 平台 API Server',
        version: '1.0.0',
        docs: '/api/v1',
        env: config.server.env,
      });
    });

    this.app.use('/api/v1', apiRoutes);

    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      logger.info(`[Server] 收到 ${signal} 信号，开始优雅关闭...`);

      const shutdownTimeout = setTimeout(() => {
        logger.error('[Server] 优雅关闭超时，强制退出');
        process.exit(1);
      }, 30000);

      try {
        if (this.server) {
          logger.info('[Server] 关闭 HTTP 服务器...');
          await new Promise<void>((resolve) => {
            this.server.close(() => {
              logger.info('[Server] HTTP 服务器已关闭');
              resolve();
            });
          });
        }

        logger.info('[MQTT] 断开 MQTT 连接...');
        await mqttClient.disconnect();

        logger.info('[Database] 断开 MongoDB 连接...');
        await databaseManager.disconnect();

        if (this.redisClient) {
          logger.info('[Redis] 断开 Redis 连接...');
          await this.redisClient.quit();
        }

        clearTimeout(shutdownTimeout);
        logger.info('[Server] 优雅关闭完成');
        process.exit(0);
      } catch (error) {
        logger.error('[Server] 优雅关闭过程中出错:', error);
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

    process.on('uncaughtException', (error) => {
      logger.error('[Server] 未捕获的异常:', error);
      if (!this.isShuttingDown) {
        shutdownHandler('uncaughtException');
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[Server] 未处理的 Promise 拒绝:', promise, reason);
    });
  }

  public async start(): Promise<void> {
    try {
      logger.info('========================================');
      logger.info('  校园直饮水 IoT 平台 API Server');
      logger.info(`  环境: ${config.server.env}`);
      logger.info('========================================');

      this.configureMiddleware();
      logger.info('[Server] 中间件配置完成');

      await this.connectRedis();

      await databaseManager.connect();
      logger.info('[Server] 数据库连接管理初始化完成');

      await this.initializeComponents();

      this.configureRoutes();
      logger.info('[Server] 路由配置完成');

      this.setupGracefulShutdown();
      logger.info('[Server] 优雅关闭处理器已安装');

      const port = config.server.port;
      this.server = this.app.listen(port, () => {
        logger.info(`[Server] API Server 已启动，监听端口: ${port}`);
        logger.info(`[Server] API 基础路径: http://localhost:${port}/api/v1`);
        logger.info(`[Server] 健康检查: http://localhost:${port}/api/v1/health`);
      });

      this.server.on('error', (error: any) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        switch (error.code) {
          case 'EACCES':
            logger.error(`[Server] 端口 ${port} 需要管理员权限`);
            process.exit(1);
          case 'EADDRINUSE':
            logger.error(`[Server] 端口 ${port} 已被占用`);
            process.exit(1);
          default:
            throw error;
        }
      });
    } catch (error) {
      logger.error('[Server] 启动失败:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getRedisClient(): Redis | null {
    return this.redisClient;
  }
}

const server = new AppServer();

if (require.main === module) {
  server.start().catch((error) => {
    logger.error('[Server] 启动过程中发生未处理的错误:', error);
    process.exit(1);
  });
}

export default server;
export { AppServer };
