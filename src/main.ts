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

  await app.listen(port);

  logger.log('========================================');
  logger.log(`🚀 应用启动成功!`);
  logger.log(`📋 环境: ${nodeEnv}`);
  logger.log(`🌐 端口: ${port}`);
  logger.log(`📡 服务地址: http://localhost:${port}`);
  logger.log(`🎯 API前缀: /api/v1`);
  if (nodeEnv !== 'production') {
    logger.log(`📚 Swagger文档: http://localhost:${port}/api/docs`);
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
