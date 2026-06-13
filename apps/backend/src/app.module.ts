import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { DeviceModule } from './modules/device/device.module';
import { ControlModule } from './modules/control/control.module';
import { ShareModule } from './modules/share/share.module';
import { SceneModule } from './modules/scene/scene.module';
import { VoiceModule } from './modules/voice/voice.module';
import { OtaModule } from './modules/ota/ota.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HomeModule } from './modules/home/home.module';
import { RedisModule } from './modules/redis/redis.module';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { SeederModule } from './modules/seeder/seeder.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    RedisModule,
    MqttModule,
    SeederModule,
    AuthModule,
    VendorModule,
    HomeModule,
    DeviceModule,
    ControlModule,
    ShareModule,
    SceneModule,
    VoiceModule,
    OtaModule,
    MonitoringModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
