import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 启用CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger文档配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('餐饮点餐收银系统 API')
    .setDescription('Restaurant Ordering & POS System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('认证', '用户登录认证相关接口')
    .addTag('桌台', '桌台管理相关接口')
    .addTag('菜单', '菜单管理相关接口')
    .addTag('订单', '订单管理相关接口')
    .addTag('支付', '支付结算相关接口')
    .addTag('会员', '会员管理相关接口')
    .addTag('报表', '报表查询相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('APP_PORT', 3800);
  await app.listen(port);
  logger.log(`餐饮点餐收银系统已启动，端口: ${port}`);
  logger.log(`API文档地址: http://localhost:${port}/api/docs`);
  logger.log(`WebSocket地址: http://localhost:${port}`);
}

bootstrap();
