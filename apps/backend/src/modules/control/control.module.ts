import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';
import { ScheduleService } from './schedule.service';
import { DeviceEntity } from '../../database/entities/device.entity';
import { DeviceCommandEntity, ScheduleTaskEntity } from '../../database/entities/telemetry.entity';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity, DeviceCommandEntity, ScheduleTaskEntity, DeviceShareEntity, HomeEntity]),
    AuthModule,
  ],
  controllers: [ControlController],
  providers: [ControlService, ScheduleService],
  exports: [ControlService, ScheduleService],
})
export class ControlModule {}
