import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { WinstonLogger, winstonLoggerInstance } from './logger/winston.logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLogger(),
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const port = configService.get<number>('port', 3000);

  const corsOrigin =
    nodeEnv === 'production'
      ? [
          'https://zwfw.nx.gov.cn',
          'https://www.zwfw.nx.gov.cn',
        ]
      : true;

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  });

  app.use(helmet());
  app.use(compression());

  app.use('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'nx-city-service-gateway',
      mode:
        process.env.LOCAL_SMOKE_MODE === 'true'
          ? 'local-smoke'
          : nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  if (process.env.LOCAL_SMOKE_MODE === 'true') {
    const smokeUser = {
      id: 'smoke-admin',
      name: '本地复验管理员',
      role: 'admin',
      department: '自治区大数据中心',
      permissions: ['dashboard:read', 'admin:read', 'profile:read'],
    };

    const smokeDashboard = {
      totalUsers: 12840,
      todayVisits: 3862,
      pendingTickets: 17,
      completedServices: 924,
      serviceHealth: 'ok',
    };

    app.use('/api/auth/me', (_req, res) => {
      res.status(200).json({ success: true, code: 0, data: smokeUser });
    });

    app.use(['/api/users/profile', '/api/user/profile'], (_req, res) => {
      res.status(200).json({
        success: true,
        code: 0,
        data: {
          ...smokeUser,
          phone: '13800000000',
          lastLoginAt: new Date().toISOString(),
        },
      });
    });

    app.use('/api/search', (req, res) => {
      const keyword = String(req.query.q || req.query.keyword || '测试');
      res.status(200).json({
        success: true,
        code: 0,
        data: {
          keyword,
          items: [
            { id: 'svc-001', type: 'service', title: '企业开办一件事', status: 'online' },
            { id: 'cert-001', type: 'certificate', title: '营业执照电子证照', status: 'available' },
          ],
        },
      });
    });

    app.use(['/api/admin/stats', '/api/admin/dashboard'], (_req, res) => {
      res.status(200).json({ success: true, code: 0, data: smokeDashboard });
    });
  }

  app.setGlobalPrefix('/api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('宁夏城市服务总入口API')
      .setDescription(
        '宁夏自治区级城市服务总入口后端系统 - 一网通办数字底座API文档',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: '输入JWT Token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer(`http://localhost:${port}`, '本地开发环境')
      .addServer('https://zwfw.nx.gov.cn', '生产环境')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      ignoreGlobalPrefix: false,
    });

    SwaggerModule.setup('/api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        tagsSorter: 'alpha',
      },
      customSiteTitle: '宁夏城市服务总入口API文档',
      customCss: '.swagger-ui .topbar { display: none }',
    });

    winstonLoggerInstance.log(
      `Swagger文档已启动: http://localhost:${port}/api/docs`,
      'Bootstrap',
    );
  }

  await app.listen(port, '127.0.0.1');

  logger.log('========================================');
  logger.log(`🚀 应用启动成功!`);
  logger.log(`📋 环境: ${nodeEnv}`);
  logger.log(`🌐 端口: ${port}`);
  logger.log(`📡 服务地址: http://127.0.0.1:${port}`);
  logger.log(`🎯 API前缀: /api/v1`);
  if (nodeEnv !== 'production') {
    logger.log(`📚 Swagger文档: http://127.0.0.1:${port}/api/docs`);
  }
  logger.log('========================================');
}

bootstrap().catch((error) => {
  winstonLoggerInstance.error(
    `应用启动失败: ${(error as Error).message}`,
    (error as Error).stack,
    'Bootstrap',
  );
  process.exit(1);
});
