import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ServiceItemModule } from './modules/service-item/service-item.module';
import { ApplicationModule } from './modules/application/application.module';
import { CertificateModule } from './modules/certificate/certificate.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PolicyModule } from './modules/policy/policy.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OpenApiModule } from './modules/open-api/open-api.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { SystemModule } from './modules/system/system.module';
import { TasksModule } from './tasks/tasks.module';
import { AdminConsoleModule } from './modules/admin-console/admin-console.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${level}] [${context || 'App'}] ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: process.env.LOG_FILE || './logs/app.log',
          maxsize: 5242880,
          maxFiles: 5,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL', 60),
          limit: configService.get('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD') || undefined,
          db: configService.get('REDIS_DB', 0),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    ServiceItemModule,
    ApplicationModule,
    CertificateModule,
    NotificationModule,
    PolicyModule,
    AiModule,
    AnalyticsModule,
    OpenApiModule,
    IntegrationModule,
    SystemModule,
    TasksModule,
    AdminConsoleModule,
  ],
})
export class AppModule {}
