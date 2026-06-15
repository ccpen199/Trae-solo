import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import 'dotenv/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-store';
import * as Joi from 'joi';

import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Sm4EncryptMiddleware } from './common/middleware/sm4-encrypt.middleware';
import { AuditLogMiddleware } from './common/middleware/audit-log.middleware';
import { AuditLog } from './common/middleware/audit-log.middleware';
import { Sm4Util } from './common/utils/sm4.util';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { ServiceHubModule } from './modules/service-hub/service-hub.module';
import { ECertModule } from './modules/e-cert/e-cert.module';
import { CityDataSecretaryModule } from './modules/city-data-secretary/city-data-secretary.module';
import { GovCitizenTicketModule } from './modules/gov-citizen-ticket/gov-citizen-ticket.module';
import { CertAccessLog } from './modules/e-cert/entities/cert-access-log.entity';

import { AuditCleanupScheduler } from './scheduler/audit-cleanup.scheduler';

const isLocalSmokeMode = process.env.LOCAL_SMOKE_MODE === 'true';

const databaseImports = isLocalSmokeMode
  ? []
  : [
      DatabaseModule,
      CacheModule.registerAsync({
        isGlobal: true,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          store: redisStore as any,
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
          db: configService.get<number>('redis.db'),
          ttl: 300,
        }),
        inject: [ConfigService],
      }),
      TypeOrmModule.forFeature([AuditLog, CertAccessLog]),
      AuthModule,
      ServiceHubModule,
      ECertModule,
      CityDataSecretaryModule,
      GovCitizenTicketModule,
    ];

const guardedProviders = isLocalSmokeMode
  ? []
  : [
      {
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
      },
      {
        provide: APP_GUARD,
        useClass: ThrottlerBehindProxyGuard,
      },
      {
        provide: APP_GUARD,
        useClass: PermissionGuard,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: TransformInterceptor,
      },
      {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter,
      },
      Sm4Util,
      AuditCleanupScheduler,
    ];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug', 'verbose')
          .default('info'),
        DB_HOST: Joi.string().default('127.0.0.1'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().allow('').default(''),
        DB_DATABASE: Joi.string().default('nx_city_service'),
        DB_SYNC: Joi.boolean().default(true),
        DB_LOGGING: Joi.boolean().default(false),
        REDIS_HOST: Joi.string().default('127.0.0.1'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').default(''),
        REDIS_DB: Joi.number().default(0),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('2h'),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(100),
        AUDIT_LOG_RETENTION_DAYS: Joi.number().default(90),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60),
          limit: configService.get<number>('throttle.limit', 100),
        },
      ],
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    ...databaseImports,
  ],
  providers: guardedProviders,
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    if (isLocalSmokeMode) {
      return;
    }

    consumer
      .apply(Sm4EncryptMiddleware, AuditLogMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
