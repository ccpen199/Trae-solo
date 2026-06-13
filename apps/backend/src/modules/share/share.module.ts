import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { DeviceEntity } from '../../database/entities/device.entity';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity, DeviceShareEntity, UserEntity, HomeEntity]),
    AuthModule,
  ],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
