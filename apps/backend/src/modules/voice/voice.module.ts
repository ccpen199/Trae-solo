import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { DeviceEntity } from '../../database/entities/device.entity';
import { SceneEntity } from '../../database/entities/scene.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity, SceneEntity]), AuthModule],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
