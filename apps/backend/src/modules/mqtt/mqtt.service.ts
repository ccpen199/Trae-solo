import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as mqtt from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import { MqttMessageType, IMqttMessage, MQTT_TOPICS } from '@iot/shared';
import { DeviceStatus, DeviceCapability } from '@iot/shared';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { TelemetryEntity, DeviceCommandEntity } from '../../database/entities/telemetry.entity';
import { CacheService } from '../redis/cache.service';
import { AlertEntity } from '../../database/entities/alert.entity';
import { AlertType, AlertSeverity, NotificationChannel } from '@iot/shared';
import { getDefaultCapabilities, generateDeviceId } from '@iot/shared';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);
  private readonly pendingRequests = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();

  constructor(
    @Inject('MQTT_CLIENT') private readonly client: mqtt.MqttClient,
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(TelemetryEntity) private readonly telemetryRepo: Repository<TelemetryEntity>,
    @InjectRepository(DeviceCommandEntity) private readonly commandRepo: Repository<DeviceCommandEntity>,
    @InjectRepository(AlertEntity) private readonly alertRepo: Repository<AlertEntity>,
    private readonly cache: CacheService,
  ) {}

  async handleMessage(topic: string, payloadStr: string) {
    try {
      const parts = topic.split('/');
      if (parts[0] !== 'iot') return;

      const vendorId = parts[1];
      const messageType = parts[parts.length - 1];
      let deviceId: string | undefined;
      if (parts.length >= 4 && messageType !== 'discovery') {
        deviceId = parts[2];
      }

      let message: IMqttMessage;
      try {
        message = JSON.parse(payloadStr);
      } catch {
        this.logger.warn(`Invalid JSON on topic ${topic}`);
        return;
      }

      const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
      if (!vendor || vendor.status !== 'active') {
        this.logger.warn(`Unauthorized vendor: ${vendorId}`);
        return;
      }

      switch (messageType) {
        case 'telemetry':
          await this.handleTelemetry(vendorId, deviceId!, message);
          break;
        case 'status':
          await this.handleStatus(vendorId, deviceId!, message);
          break;
        case 'heartbeat':
          await this.handleHeartbeat(vendorId, deviceId!);
          break;
        case 'command/resp':
          await this.handleCommandResponse(vendorId, deviceId!, message);
          break;
        case 'discovery':
          await this.handleDiscovery(vendorId, message);
          break;
        default:
          this.logger.debug(`Unhandled message type: ${messageType}`);
      }
    } catch (err) {
      this.logger.error(`Error handling MQTT message [${topic}]:`, err);
    }
  }

  private async handleTelemetry(vendorId: string, deviceId: string, message: IMqttMessage) {
    const payload = message.payload as any;
    const now = new Date();

    const platformDeviceId = generateDeviceId(vendorId, deviceId);
    await this.cache.set(`device:status:${platformDeviceId}`, {
      status: DeviceStatus.ONLINE,
      lastSeen: now,
      ...payload.properties,
    }, 300);

    const device = await this.deviceRepo.findOne({ where: { id: platformDeviceId } });
    if (device) {
      const newProps = { ...device.properties, ...payload.properties };
      const partialUpdate: Partial<DeviceEntity> = {
        status: DeviceStatus.ONLINE,
        properties: newProps,
        lastSeen: now,
        lastTelemetryAt: now,
        powerConsumption: payload.powerConsumption ?? device.powerConsumption,
      };
      if (payload.properties?.battery !== undefined) {
        newProps['battery'] = payload.properties.battery;
        if (payload.properties.battery <= 10) {
          await this.createLowBatteryAlert(device, payload.properties.battery);
        }
      }
      await this.deviceRepo.update(platformDeviceId, partialUpdate);
    }

    const telemetry = this.telemetryRepo.create({
      deviceId: platformDeviceId,
      vendorId,
      timestamp: now,
      properties: payload.properties || {},
      powerConsumption: payload.powerConsumption,
      signalStrength: payload.signalStrength,
      temperature: payload.properties?.temperature,
      humidity: payload.properties?.humidity,
      battery: payload.properties?.battery,
    });
    await this.telemetryRepo.save(telemetry);

    const todayKey = `device:online:${now.toISOString().slice(0, 10)}:${platformDeviceId}`;
    await this.cache.incr(todayKey);
    await this.cache.getClient().expire(todayKey, 86400 * 7);
  }

  private async handleStatus(vendorId: string, deviceId: string, message: IMqttMessage) {
    const platformDeviceId = generateDeviceId(vendorId, deviceId);
    const status = message.payload.status as DeviceStatus;
    const now = new Date();

    await this.cache.set(`device:status:${platformDeviceId}`, { status, lastSeen: now }, 300);
    await this.deviceRepo.update(platformDeviceId, {
      status,
      lastSeen: now,
      properties: { ...(message.payload.properties || {}) },
    });
  }

  private async handleHeartbeat(vendorId: string, deviceId: string) {
    const platformDeviceId = generateDeviceId(vendorId, deviceId);
    const now = new Date();
    await this.cache.set(`device:status:${platformDeviceId}`, {
      status: DeviceStatus.ONLINE,
      lastSeen: now,
    }, 300);
    await this.deviceRepo.update(platformDeviceId, {
      status: DeviceStatus.ONLINE,
      lastSeen: now,
    });
  }

  private async handleCommandResponse(vendorId: string, deviceId: string, message: IMqttMessage) {
    const resp = message.payload as any;
    const platformDeviceId = generateDeviceId(vendorId, deviceId);
    const now = new Date();

    await this.commandRepo.update(
      { requestId: resp.requestId },
      {
        isDelivered: true,
        isExecuted: true,
        success: resp.success,
        result: resp.result,
        errorMessage: resp.errorMessage,
        executedAt: now,
      },
    );

    const pending = this.pendingRequests.get(resp.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      if (resp.success) pending.resolve(resp.result);
      else pending.reject(new Error(resp.errorMessage || 'Command failed'));
      this.pendingRequests.delete(resp.requestId);
    }
  }

  private async handleDiscovery(vendorId: string, message: IMqttMessage) {
    const devices = Array.isArray(message.payload) ? message.payload : [message.payload];
    for (const d of devices) {
      const platformDeviceId = generateDeviceId(vendorId, d.vendorDeviceId);
      const existing = await this.deviceRepo.findOne({ where: { id: platformDeviceId } });
      if (!existing) {
        const capabilities = d.capabilities?.length ? d.capabilities : getDefaultCapabilities(d.category);
        const device = this.deviceRepo.create({
          id: platformDeviceId,
          vendorId,
          vendorDeviceId: d.vendorDeviceId,
          name: d.name,
          model: d.model,
          category: d.category,
          connectivity: d.connectivity || [],
          status: DeviceStatus.OFFLINE,
          firmwareVersion: d.firmwareVersion,
          properties: d.properties || {},
          capabilities: capabilities,
        });
        await this.deviceRepo.save(device);
        this.logger.log(`Discovered new device: ${platformDeviceId}`);
      }
    }
  }

  private async createLowBatteryAlert(device: DeviceEntity, batteryLevel: number) {
    const recentAlert = await this.alertRepo.findOne({
      where: { deviceId: device.id, type: AlertType.LOW_BATTERY, status: 'open' as any },
    });
    if (recentAlert) return;

    const alert = this.alertRepo.create({
      type: AlertType.LOW_BATTERY,
      severity: batteryLevel <= 5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
      deviceId: device.id,
      homeId: device.homeId || 'unknown',
      vendorId: device.vendorId,
      title: `${device.name} 电量不足`,
      message: `设备当前电量为 ${batteryLevel}%，请及时更换电池或充电`,
      data: { batteryLevel, deviceName: device.name },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
    });
    await this.alertRepo.save(alert);
    this.logger.log(`Created low battery alert for device ${device.id}`);
  }

  async sendCommand(
    vendorId: string,
    vendorDeviceId: string,
    command: string,
    params: Record<string, any> = {},
    timeoutMs = 5000,
  ): Promise<any> {
    const requestId = uuidv4();
    const message: IMqttMessage = {
      messageId: uuidv4(),
      type: MqttMessageType.COMMAND,
      timestamp: Date.now(),
      vendorId,
      deviceId: vendorDeviceId,
      payload: { command, params, requestId, timeoutMs },
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Command timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const topic = MQTT_TOPICS.command(vendorId, vendorDeviceId);
      this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
        if (err) {
          clearTimeout(timeout);
          this.pendingRequests.delete(requestId);
          reject(err);
        }
      });
    });
  }

  async publishOtaUpdate(vendorId: string, vendorDeviceId: string, firmwareInfo: any) {
    const topic = MQTT_TOPICS.ota(vendorId, vendorDeviceId);
    const message: IMqttMessage = {
      messageId: uuidv4(),
      type: MqttMessageType.OTA,
      timestamp: Date.now(),
      vendorId,
      deviceId: vendorDeviceId,
      payload: firmwareInfo,
    };
    this.client.publish(topic, JSON.stringify(message), { qos: 2 });
  }

  getClient() {
    return this.client;
  }
}
