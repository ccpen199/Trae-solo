import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { User } from './users/entities/user.entity';
import { Content, Category } from './contents/entities/content.entity';
import { ContentVersion } from './contents/entities/content-version.entity';
import { MediaAsset, ContentMedia } from './media/entities/media-asset.entity';
import { Review, WorkflowInstance, WorkflowStep } from './workflow/entities/review.entity';
import { Distribution, DistributionSchedule } from './distribution/entities/distribution.entity';
import { EngagementMetric } from './analytics/entities/engagement-metric.entity';
import { AuditLog, SensitiveWordLog } from './audit/entities/audit-log.entity';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ContentsModule } from './contents/contents.module';
import { MediaModule } from './media/media.module';
import { WorkflowModule } from './workflow/workflow.module';
import { DistributionModule } from './distribution/distribution.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { CommonModule } from './common/common.module';
import { SeedersModule } from './seeders/seeders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.docker'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'sqlite') as 'sqlite' | 'postgres';
        
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 15432),
            username: configService.get('DB_USER', 'cms_admin'),
            password: configService.get('DB_PASSWORD', 'CMS_Admin_2024_Secure'),
            database: configService.get('DB_NAME', 'cms_platform'),
            entities: [
              User,
              Category,
              Content,
              ContentVersion,
              MediaAsset,
              ContentMedia,
              Review,
              WorkflowInstance,
              WorkflowStep,
              Distribution,
              DistributionSchedule,
              EngagementMetric,
              AuditLog,
              SensitiveWordLog,
            ],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: configService.get('NODE_ENV') === 'development',
            ssl: false,
          };
        }
        
        return {
          type: 'better-sqlite3',
          database: configService.get('DB_PATH', './data/cms.db'),
          entities: [
            User,
            Category,
            Content,
            ContentVersion,
            MediaAsset,
            ContentMedia,
            Review,
            WorkflowInstance,
            WorkflowStep,
            Distribution,
            DistributionSchedule,
            EngagementMetric,
            AuditLog,
            SensitiveWordLog,
          ],
          synchronize: true,
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    AuthModule,
    ContentsModule,
    MediaModule,
    WorkflowModule,
    DistributionModule,
    AnalyticsModule,
    AuditModule,
    CommonModule,
    SeedersModule,
  ],
})
export class AppModule {}
