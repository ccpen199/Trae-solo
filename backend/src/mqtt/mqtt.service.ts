import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { SensorsService } from '../sensors/sensors.service';
import { AlarmsService } from '../alarms/alarms.service';
import { FarmGateway } from '../websocket/farm.gateway';
import { AuditService } from '../audit/audit.service';
import { AuditResourceType } from '../audit/entities/audit-log.entity';

interface SensorData {
  sensorId: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient | null = null;
  private readonly logger = new Logger(MqttService.name);
  private isEnabled: boolean = true;

  private readonly topicPatterns = {
    sensorData: 'farm/+/sensors/+/data',
    sensorHeartbeat: 'farm/+/sensors/+/heartbeat',
    deviceStatus: 'farm/+/devices/+/status',
    commandResponse: 'farm/+/devices/+/response',
  };

  constructor(
    private configService: ConfigService,
    private sensorsService: SensorsService,
    private alarmsService: AlarmsService,
    private farmGateway: FarmGateway,
    private auditService: AuditService,
  ) {}

  onModuleInit() {
    this.isEnabled = this.configService.get('MQTT_ENABLED', 'true') === 'true';
    if (this.isEnabled) {
      this.connect();
    } else {
      this.logger.log('MQTT service is disabled');
    }
  }

  private connect() {
    const brokerUrl = this.configService.get('MQTT_BROKER_URL', 'mqtt://localhost:1883');
    const clientId = this.configService.get('MQTT_CLIENT_ID', 'smart-farm-backend');

    this.logger.log(`Connecting to MQTT broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId: `${clientId}-${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30 * 1000,
    });

    this.client.on('connect', () => {
      this.logger.log('MQTT client connected successfully');
      this.subscribeToTopics();
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT connection error: ${error.message}`);
    });

    this.client.on('reconnect', () => {
      this.logger.log('MQTT client reconnecting...');
    });

    this.client.on('close', () => {
      this.logger.log('MQTT client connection closed');
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });
  }

  private subscribeToTopics() {
    const topics = [
      this.topicPatterns.sensorData,
      this.topicPatterns.sensorHeartbeat,
      this.topicPatterns.deviceStatus,
      this.topicPatterns.commandResponse,
    ];

    topics.forEach((topic) => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to topic ${topic}: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, message: string) {
    this.logger.debug(`Received message on topic ${topic}: ${message.substring(0, 200)}`);

    try {
      const topicParts = topic.split('/');

      if (topic.includes('sensors') && topic.includes('data')) {
        await this.handleSensorData(topicParts, message);
      } else if (topic.includes('sensors') && topic.includes('heartbeat')) {
        await this.handleSensorHeartbeat(topicParts, message);
      } else if (topic.includes('devices') && topic.includes('status')) {
        await this.handleDeviceStatus(topicParts, message);
      } else if (topic.includes('devices') && topic.includes('response')) {
        await this.handleCommandResponse(topicParts, message);
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
    }
  }

  private async handleSensorData(topicParts: string[], message: string) {
    const zone = topicParts[1];
    const sensorId = topicParts[3];

    let data: SensorData;
    try {
      data = JSON.parse(message);
    } catch (error) {
      this.logger.error(`Failed to parse sensor data: ${message}`);
      return;
    }

    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

    const sensorReading = await this.sensorsService.processSensorData(
      sensorId || data.sensorId,
      data.value,
      timestamp,
      data.metadata,
    );

    this.farmGateway.broadcastSensorReading(sensorReading, zone);

    this.checkAndCreateAlarm(sensorReading, zone);

    await this.auditService.logExecute(
      AuditResourceType.SENSOR_READING,
      sensorReading.id,
      `Sensor ${sensorReading.sensorId}`,
      'sensor_data_received',
      {
        rawValue: sensorReading.rawValue,
        filteredValue: sensorReading.filteredValue,
        dataQuality: sensorReading.dataQuality,
        isOutlier: sensorReading.isOutlier,
      },
      'system',
      'MQTT Service',
    );
  }

  private async handleSensorHeartbeat(topicParts: string[], message: string) {
    const zone = topicParts[1];
    const sensorId = topicParts[3];

    await this.sensorsService.updateSensorHeartbeat(sensorId);

    this.logger.debug(`Sensor heartbeat received: ${sensorId} in zone ${zone}`);
  }

  private async handleDeviceStatus(topicParts: string[], message: string) {
    const zone = topicParts[1];
    const deviceId = topicParts[3];

    let statusData;
    try {
      statusData = JSON.parse(message);
    } catch (error) {
      this.logger.error(`Failed to parse device status: ${message}`);
      return;
    }

    this.farmGateway.broadcastMessage('device_status', {
      deviceId,
      zone,
      status: statusData.status,
      currentValue: statusData.currentValue,
      timestamp: new Date(),
    });

    await this.auditService.logExecute(
      AuditResourceType.CONTROL_DEVICE,
      deviceId,
      `Device ${deviceId}`,
      'device_status_update',
      statusData,
      'system',
      'MQTT Service',
    );
  }

  private async handleCommandResponse(topicParts: string[], message: string) {
    const zone = topicParts[1];
    const deviceId = topicParts[3];

    let responseData;
    try {
      responseData = JSON.parse(message);
    } catch (error) {
      this.logger.error(`Failed to parse command response: ${message}`);
      return;
    }

    this.farmGateway.broadcastControlStatus(responseData);

    await this.auditService.logExecute(
      AuditResourceType.CONTROL_COMMAND,
      responseData.commandId || 'unknown',
      `Command for device ${deviceId}`,
      'command_response',
      responseData,
      'system',
      'MQTT Service',
    );
  }

  private async checkAndCreateAlarm(sensorReading: any, zone: string) {
    if (sensorReading.isOutlier) {
      return;
    }

    if (sensorReading.filteredValue === null) {
      return;
    }

    try {
      const alarm = await this.alarmsService.checkAndCreateAlarm(
        sensorReading.sensorId,
        sensorReading.filteredValue,
        sensorReading.timestamp,
      );

      if (alarm) {
        this.farmGateway.broadcastAlarmCreated(alarm);

        this.logger.log(`Alarm created: ${alarm.id} - ${alarm.title}`);

        await this.auditService.logExecute(
          AuditResourceType.ALARM,
          alarm.id,
          alarm.title,
          'alarm_triggered',
          {
            severity: alarm.severity,
            actualValue: alarm.actualValue,
            thresholdMin: alarm.thresholdMin,
            thresholdMax: alarm.thresholdMax,
            isAdjusted: alarm.isAdjusted,
            weatherForecast: alarm.weatherForecast,
          },
          'system',
          'Alarms Service',
          undefined,
          alarm.id,
        );
      }
    } catch (error) {
      this.logger.error(`Error checking alarm: ${error.message}`);
    }
  }

  publishCommand(deviceId: string, command: any) {
    if (!this.isEnabled || !this.client) {
      this.logger.warn('MQTT is disabled or not connected, cannot publish command');
      return;
    }

    const topic = `farm/default/devices/${deviceId}/command`;
    const message = JSON.stringify({
      ...command,
      timestamp: new Date().toISOString(),
    });

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        this.logger.error(`Failed to publish command: ${err.message}`);
      } else {
        this.logger.log(`Command published to ${topic}`);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.logger.log('MQTT client disconnected');
    }
  }
}
