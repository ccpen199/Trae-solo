import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, trace }) => {
            return `${timestamp} [${level}] [${context || 'Application'}] ${message}${trace ? '\n' + trace : ''}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: process.env.LOG_FILE || './logs/app.log',
        maxsize: 5242880,
        maxFiles: 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
    cors: {
      origin: true,
      credentials: true,
    },
  });

  const globalPrefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(logger),
  );

  const config = new DocumentBuilder()
    .setTitle('广州市统一政务服务移动端后端支撑平台')
    .setDescription('数字政府核心业务中台 API 接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('认证', '身份认证与授权')
    .addTag('用户', '用户信息管理')
    .addTag('事项', '事项标准化管理')
    .addTag('办件', '线上办件引擎')
    .addTag('证照', '电子证照管理')
    .addTag('通知', '消息通知中心')
    .addTag('政策', '政策文件管理')
    .addTag('AI', 'AI语料与问答')
    .addTag('统计', '数据统计与分析')
    .addTag('开放平台', '第三方小程序API')
    .addTag('系统', '系统管理与配置')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`政务服务平台已启动: http://localhost:${port}${globalPrefix}`);
  logger.log(`API文档地址: http://localhost:${port}${globalPrefix}/docs`);
}

bootstrap();
