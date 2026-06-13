import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { HomeEntity } from '../../database/entities/home.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HomeEntity, RoomEntity, DeviceEntity, UserEntity]),
    AuthModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
