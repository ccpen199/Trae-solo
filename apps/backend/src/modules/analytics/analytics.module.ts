import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { LearningService } from './learning.service';
import { SceneEntity } from '../../database/entities/scene.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { TelemetryEntity, UserBehaviorLogEntity } from '../../database/entities/telemetry.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SceneEntity, DeviceEntity, TelemetryEntity, HomeEntity, UserEntity, UserBehaviorLogEntity]),
    AuthModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, LearningService],
  exports: [AnalyticsService, LearningService],
})
export class AnalyticsModule {}
