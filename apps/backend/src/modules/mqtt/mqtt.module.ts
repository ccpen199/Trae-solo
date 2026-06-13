import { Module, Global, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as mqtt from 'mqtt';
import { MqttService } from './mqtt.service';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { TelemetryEntity, DeviceCommandEntity } from '../../database/entities/telemetry.entity';
import { AlertEntity } from '../../database/entities/alert.entity';
import { CacheService } from '../redis/cache.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([VendorEntity, DeviceEntity, TelemetryEntity, DeviceCommandEntity, AlertEntity])],
  providers: [CacheService,
    MqttService,
    {
      provide: 'MQTT_CLIENT',
      useFactory: () => {
        const logger = new Logger('MQTT');
        const client = mqtt.connect({
          host: process.env.MQTT_HOST || 'localhost',
          port: parseInt(process.env.MQTT_PORT || '1883', 10),
          username: process.env.MQTT_USERNAME || 'admin',
          password: process.env.MQTT_PASSWORD || 'public',
          reconnectPeriod: 5000,
          clean: true,
          clientId: `iot_backend_${Date.now()}`,
        });

        client.on('connect', () => {
          logger.log('MQTT Broker connected');
          client.subscribe([
            'iot/+/+/telemetry',
            'iot/+/+/status',
            'iot/+/+/command/resp',
            'iot/+/+/heartbeat',
            'iot/+/discovery',
          ], { qos: 1 }, (err) => {
            if (err) logger.error('MQTT subscribe error:', err);
            else logger.log('MQTT topics subscribed');
          });
        });

        client.on('error', (err) => logger.error('MQTT error:', err));
        client.on('reconnect', () => logger.warn('MQTT reconnecting...'));
        client.on('close', () => logger.warn('MQTT connection closed'));

        return client;
      },
    },
  ],
  exports: [MqttService, 'MQTT_CLIENT'],
})
export class MqttModule implements OnModuleInit {
  constructor(
    private readonly mqttService: MqttService,
    @Inject('MQTT_CLIENT') private readonly client: mqtt.MqttClient,
  ) {}

  onModuleInit() {
    this.client.on('message', (topic, payload) => {
      this.mqttService.handleMessage(topic, payload.toString());
    });
  }
}
