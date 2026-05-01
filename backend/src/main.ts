import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: ['http://localhost:9234', 'http://127.0.0.1:9234', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const apiPrefix = configService.get('API_PREFIX', '/api/v1');
  app.setGlobalPrefix(apiPrefix);
  logger.log(`📖 API prefix: ${apiPrefix}`);

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

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = configService.get('PORT', 8760);
  await app.listen(port);
  
  logger.log(`========================================`);
  logger.log(`🚀 CMS Backend Service started successfully`);
  logger.log(`📍 URL: http://localhost:${port}`);
  logger.log(`🔧 Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`========================================`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
