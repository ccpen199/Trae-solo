import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AuthMiddleware } from './common/auth/auth.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:51888', 'http://localhost:51889', 'http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 配置认证中间件
  app.use((req, res, next) => {
    const path = req.path;
    // 不需要认证的路径
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/docs', '/api/docs-json'];
    
    if (publicPaths.some(p => path.startsWith(p))) {
      next();
    } else {
      const authMiddleware = app.get(AuthMiddleware);
      authMiddleware.use(req, res, next);
    }
  });

  const config = new DocumentBuilder()
    .setTitle('食品生产管理系统API')
    .setDescription('原料入库-领料生产-批次质检-包装入库-发货追溯全流程管理')
    .setVersion('1.0')
    .addTag('auth', '用户认证')
    .addTag('users', '用户管理')
    .addTag('采购', '采购人员功能：原料入库')
    .addTag('仓库', '仓库管理：库存台账、出入库')
    .addTag('生产', '生产班组：工单、领料、工序上报')
    .addTag('质检', '质检人员：批次质检')
    .addTag('追溯', '质量追溯：批次全链路回溯')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`食品生产管理系统 API 已启动: http://localhost:${port}/api`);
  console.log(`API 文档: http://localhost:${port}/api/docs`);
}

bootstrap();
