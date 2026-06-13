import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtaController } from './ota.controller';
import { OtaService } from './ota.service';
import { FirmwareEntity, OtaJobEntity } from '../../database/entities/ota.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FirmwareEntity, OtaJobEntity, DeviceEntity, VendorEntity]),
    AuthModule,
  ],
  controllers: [OtaController],
  providers: [OtaService],
  exports: [OtaService],
})
export class OtaModule {}
