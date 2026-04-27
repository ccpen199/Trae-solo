import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgronomyModule } from './agronomy/agronomy.module';
import { SensorsModule } from './sensors/sensors.module';
import { AlarmsModule } from './alarms/alarms.module';
import { ControlModule } from './control/control.module';
import { TraceabilityModule } from './traceability/traceability.module';
import { AuditModule } from './audit/audit.module';
import { WebsocketModule } from './websocket/websocket.module';
import { MqttModule } from './mqtt/mqtt.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DB_DATABASE', 'data/smart_farm.db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AgronomyModule,
    SensorsModule,
    AlarmsModule,
    ControlModule,
    TraceabilityModule,
    AuditModule,
    WebsocketModule,
    MqttModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
