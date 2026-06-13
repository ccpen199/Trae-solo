import { Module, Global, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as mqtt from 'mqtt';
import EventEmitter from 'events';
import { MqttService } from './mqtt.service';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { TelemetryEntity, DeviceCommandEntity } from '../../database/entities/telemetry.entity';
import { AlertEntity } from '../../database/entities/alert.entity';

class MockMqttClient extends EventEmitter {
  private readonly logger = new Logger('MockMQTT');
  connected = true;
  reconnecting = false;

  publish(topic: string, message: string | Buffer, opts?: mqtt.IClientPublishOptions, callback?: mqtt.PacketCallback) {
    this.logger.warn(`Mock MQTT publish called on topic '${topic}' - not connected to real broker`);
    if (callback) {
      setImmediate(() => callback(undefined));
    }
    return this;
  }

  subscribe(topic: string | string[], opts?: mqtt.IClientSubscribeOptions, callback?: mqtt.ClientSubscribeCallback) {
    if (callback) {
      const topics = Array.isArray(topic) ? topic : [topic];
      const granted = topics.map((t) => ({ topic: t, qos: (opts?.qos ?? 0) as 0 | 1 | 2 }));
      setImmediate(() => callback(undefined, granted));
    }
    return this;
  }

  unsubscribe(topic: string | string[], opts?: object, callback?: mqtt.PacketCallback) {
    if (callback) {
      setImmediate(() => callback(undefined));
    }
    return this;
  }

  end(force?: boolean, opts?: object, callback?: () => void) {
    this.connected = false;
    if (callback) callback();
    return this;
  }

  reconnect() {
    this.logger.warn('Mock MQTT reconnect called - not connected to real broker');
    return this;
  }

  removeOutgoingMessage(_messageId: number) {
    return this;
  }

  handleMessage(_packet: mqtt.Packet, _callback: () => void): void {
  }

  get connectedState(): string {
    return 'connected';
  }
}

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([VendorEntity, DeviceEntity, TelemetryEntity, DeviceCommandEntity, AlertEntity])],
  providers: [
    MqttService,
    {
      provide: 'MQTT_CLIENT',
      useFactory: async () => {
        const logger = new Logger('MQTT');

        const setupClient = (client: mqtt.MqttClient, isMock: boolean) => {
          client.on('connect', () => {
            if (isMock) {
              logger.log('Mock MQTT client ready (no real broker connected)');
            } else {
              logger.log('MQTT Broker connected');
            }
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
        };

        try {
          const client = mqtt.connect({
            host: process.env.MQTT_HOST || 'localhost',
            port: parseInt(process.env.MQTT_PORT || '1883', 10),
            username: process.env.MQTT_USERNAME || 'admin',
            password: process.env.MQTT_PASSWORD || 'public',
            reconnectPeriod: 0,
            clean: true,
            clientId: `iot_backend_${Date.now()}`,
            connectTimeout: 2000,
          });

          const connectPromise = new Promise<mqtt.MqttClient>((resolve, reject) => {
            client.once('connect', () => resolve(client));
            client.once('error', (err) => reject(err));
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('MQTT connection timeout')), 2000);
          });

          const connectedClient = await Promise.race([connectPromise, timeoutPromise]);
          setupClient(connectedClient, false);
          return connectedClient;
        } catch (err) {
          logger.warn(`MQTT connection failed, using mock client: ${(err as Error).message}`);
          const mockClient = new MockMqttClient();
          process.nextTick(() => {
            mockClient.emit('connect');
          });
          setupClient(mockClient as unknown as mqtt.MqttClient, true);
          return mockClient as unknown as mqtt.MqttClient;
        }
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
