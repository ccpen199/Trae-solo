import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { UserEntity } from '../../database/entities/user.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { SceneEntity } from '../../database/entities/scene.entity';
import { AlertEntity } from '../../database/entities/alert.entity';
import { FirmwareEntity } from '../../database/entities/ota.entity';
import { TelemetryEntity } from '../../database/entities/telemetry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      VendorEntity,
      DeviceEntity,
      HomeEntity,
      RoomEntity,
      SceneEntity,
      AlertEntity,
      FirmwareEntity,
      TelemetryEntity,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
