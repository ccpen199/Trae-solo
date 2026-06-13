import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { cors: true });

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

  const port = parseInt(process.env.BACKEND_PORT || '3000', 10);
  await app.listen(port, process.env.BACKEND_HOST || '0.0.0.0');
  logger.log(`IoT Platform Backend running on http://localhost:${port}`);
  logger.log(`Swagger API Docs: http://localhost:${port}/docs`);
}

bootstrap();
