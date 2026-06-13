import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { DeviceEntity } from '../../database/entities/device.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';
import { TelemetryEntity } from '../../database/entities/telemetry.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity, VendorEntity, DeviceShareEntity, TelemetryEntity, RoomEntity, HomeEntity]),
    AuthModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
