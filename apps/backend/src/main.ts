import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { cors: true });

  const expressApp = app.getHttpAdapter().getInstance();
  const healthHandler = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'ok',
      service: 'iot-unified-platform',
    });
  };
  expressApp.get('/api/health', healthHandler);
  expressApp.get('/health', healthHandler);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('IoT 统一管控平台 API')
    .setDescription('跨品牌IoT设备统一管控平台 - 设备管理、场景编排、监控告警')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', '用户认证与授权')
    .addTag('Vendors', '厂商管理')
    .addTag('Devices', '设备管理')
    .addTag('Control', '设备控制')
    .addTag('Share', '设备分享与权限')
    .addTag('Scenes', '智能场景编排')
    .addTag('Voice', '语音指令')
    .addTag('OTA', '固件升级')
    .addTag('Monitoring', '监控与告警')
    .addTag('Analytics', '数据分析')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.BACKEND_PORT || process.env.PORT || '3000', 10);
  const host = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
  await app.listen(port, host);
  logger.log(`IoT Platform Backend running on http://${host}:${port}`);
  logger.log(`Swagger API Docs: http://${host}:${port}/docs`);
}

bootstrap();
