import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { AlertService } from './alert.service';
import { NotificationService } from './notification.service';
import { AlertEntity } from '../../database/entities/alert.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { TelemetryEntity, UserBehaviorLogEntity } from '../../database/entities/telemetry.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity, DeviceEntity, TelemetryEntity, HomeEntity, UserEntity, VendorEntity, UserBehaviorLogEntity]),
    AuthModule,
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService, AlertService, NotificationService],
  exports: [MonitoringService, AlertService, NotificationService],
})
export class MonitoringModule {}
