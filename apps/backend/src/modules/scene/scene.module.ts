import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SceneController } from './scene.controller';
import { SceneService } from './scene.service';
import { SceneEngineService } from './scene-engine.service';
import { SceneEntity } from '../../database/entities/scene.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { DeviceCommandEntity, ScheduleTaskEntity } from '../../database/entities/telemetry.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SceneEntity, DeviceEntity, DeviceCommandEntity, ScheduleTaskEntity]),
    AuthModule,
  ],
  controllers: [SceneController],
  providers: [SceneService, SceneEngineService],
  exports: [SceneService, SceneEngineService],
})
export class SceneModule {}
