import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { PORTS_CONFIG, validatePort, getFallbackPort, isPortReserved } from '../config/ports';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  logger.log('🚀 正在启动医院预约挂号系统后端服务...');

  let backendPort = parseInt(process.env.BACKEND_PORT || String(PORTS_CONFIG.BACKEND_PORT), 10);
  
  const portValidation = validatePort(backendPort);
  if (!portValidation.valid) {
    logger.warn(`⚠️  端口验证失败: ${portValidation.reason}`);
    const fallbackPort = getFallbackPort(backendPort);
    logger.log(`🔄 尝试使用备用端口: ${fallbackPort}`);
    backendPort = fallbackPort;
  }

  if (isPortReserved(backendPort)) {
    logger.warn(`⚠️  端口 ${backendPort} 是常见开发端口，已被保留`);
    const fallbackPort = getFallbackPort(backendPort);
    logger.log(`🔄 切换到备用端口: ${fallbackPort}`);
    backendPort = fallbackPort;
  }

  process.env.BACKEND_PORT = String(backendPort);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:9358',
      'http://localhost:9358',
      'http://127.0.0.1:9358',
      `http://localhost:${backendPort}`,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Requested-With'],
    exposedHeaders: ['X-Request-ID'],
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(compression());

  app.setGlobalPrefix(process.env.API_PREFIX || '/api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          const constraints = error.constraints;
          return constraints ? Object.values(constraints).join(', ') : `字段 ${error.property} 验证失败`;
        });
        return new BadRequestException({
          message: '数据验证失败',
          errors: messages,
        });
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  app.use(RequestIdMiddleware);

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('医院预约挂号系统 API')
      .setDescription('医院预约挂号系统后端 API 文档')
      .setVersion('1.0.0')
      .addTag('认证', '用户认证相关接口')
      .addTag('用户', '用户管理相关接口')
      .addTag('科室', '科室管理相关接口')
      .addTag('医生', '医生管理相关接口')
      .addTag('排班', '排班管理相关接口')
      .addTag('号源', '号源管理相关接口')
      .addTag('预约', '预约管理相关接口')
      .addTag('挂号', '挂号管理相关接口')
      .addTag('支付', '支付管理相关接口')
      .addTag('队列', '队列管理相关接口')
      .addTag('签到', '签到管理相关接口')
      .addTag('就诊', '就诊管理相关接口')
      .addTag('退费', '退费管理相关接口')
      .addTag('审计', '审计日志相关接口')
      .addTag('统计', '统计分析相关接口')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    });
    logger.log(`📚 API 文档已启用: http://localhost:${backendPort}/api/docs`);
  }

  let serverStarted = false;
  let currentPort = backendPort;
  const maxRetries = 5;
  let retryCount = 0;

  while (!serverStarted && retryCount < maxRetries) {
    try {
      await app.listen(currentPort);
      serverStarted = true;
      logger.log(`✅ 服务启动成功，端口: ${currentPort}`);
    } catch (error) {
      retryCount++;
      if (error.code === 'EADDRINUSE') {
        logger.warn(`⚠️  端口 ${currentPort} 已被占用`);
        if (retryCount < maxRetries) {
          currentPort = getFallbackPort(currentPort);
          logger.log(`🔄 尝试端口 ${currentPort}...`);
        } else {
          logger.error(`❌ 端口冲突！尝试了 ${maxRetries} 个端口均失败`);
          logger.error(`💡 请手动修改 .env 文件中的 BACKEND_PORT 端口号`);
          logger.error(`💡 推荐端口范围: 20000-30000`);
          process.exit(1);
        }
      } else {
        logger.error(`❌ 启动失败: ${error.message}`);
        process.exit(1);
      }
    }
  }

  const serverUrl = await app.getUrl();
  logger.log('');
  logger.log('========================================');
  logger.log('🏥 医院预约挂号系统');
  logger.log('========================================');
  logger.log(`🌐 服务地址: ${serverUrl}`);
  logger.log(`🔌 API 前缀: ${process.env.API_PREFIX || '/api'}`);
  logger.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
  logger.log('========================================');
  logger.log('');
}

bootstrap()
  .catch((error) => {
    logger.error('❌ 服务启动失败:', error);
    process.exit(1);
  });
