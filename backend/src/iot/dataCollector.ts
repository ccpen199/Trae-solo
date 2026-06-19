import { config } from '@config/index';
import { Device } from '@models/Device';
import { IoTData, IoTDataType } from '@models/IoTData';
import { CryptoService } from '@security/crypto';
import { AntiReplayProtection } from '@security/antiReplay';
import { DeviceAuthService } from '@security/deviceAuth';
import { logger } from '@utils/logger';
import { mqttClient } from './mqttClient';

export enum DataType {
  HEARTBEAT = 'heartbeat',
  TELEMETRY = 'telemetry',
  EVENT = 'event',
  ALERT = 'alert',
  OFFLINE_SYNC = 'offline_sync'
}

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface IoTMessage {
  deviceId: string;
  dataType: DataType;
  timestamp: number;
  transactionNo: string;
  nonce: string;
  data: Record<string, any>;
  signature?: string;
}

export interface HeartbeatData {
  uptime: number;
  signalStrength: number;
  batteryLevel?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  networkStatus: string;
  temperature?: number;
}

export interface TelemetryData {
  temperature?: number;
  flowRate?: number;
  totalFlow?: number;
  pressure?: number;
  heaterPower?: number;
  uvLightOn?: boolean;
  valveOpen?: boolean;
  isHeating?: boolean;
  energyConsumption?: number;
  signalStrength?: number;
  batteryLevel?: number;
  [key: string]: number | string | boolean | null | undefined;
}

export interface EventData {
  eventType: string;
  eventCode: string;
  description: string;
  eventData?: Record<string, any>;
}

export interface AlertData {
  alertCode: string;
  alertLevel: AlertLevel;
  description: string;
  alertData?: Record<string, any>;
  resolved?: boolean;
}

export interface DataProcessResult {
  success: boolean;
  dataId?: string;
  error?: string;
}

class DataCollectorService {
  private dataProcessors: Map<DataType, (deviceId: string, data: any, timestamp: number, transactionNo: string, nonce: string) => Promise<DataProcessResult>>;

  constructor() {
    this.dataProcessors = new Map();
    this.initializeProcessors();
    this.setupSubscriptions();
  }

  private initializeProcessors(): void {
    this.dataProcessors.set(DataType.HEARTBEAT, this.processHeartbeat.bind(this));
    this.dataProcessors.set(DataType.TELEMETRY, this.processTelemetry.bind(this));
    this.dataProcessors.set(DataType.EVENT, this.processEvent.bind(this));
    this.dataProcessors.set(DataType.ALERT, this.processAlert.bind(this));
  }

  private setupSubscriptions(): void {
    const topics = [
      'device/+/heartbeat',
      'device/+/telemetry',
      'device/+/event',
      'device/+/alert'
    ];

    for (const topic of topics) {
      mqttClient.subscribe(topic, this.handleDataMessage.bind(this));
    }
  }

  public async handleDataMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const dataTypeStr = topicParts[2] as DataType;

      logger.debug(`[DataCollector] 收到数据 - Topic: ${topic}, DeviceId: ${deviceId}`);

      const message: IoTMessage = JSON.parse(payload.toString());

      const isValid = await this.validateMessage(deviceId, message);
      if (!isValid) {
        logger.error(`[DataCollector] 消息验证失败 - DeviceId: ${deviceId}, DataType: ${dataTypeStr}`);
        return;
      }

      const replayCheck = await AntiReplayProtection.checkReplayAttack(
        deviceId,
        message.nonce,
        Math.floor(message.timestamp / 1000)
      );

      if (replayCheck.isReplay) {
        logger.warn(`[DataCollector] 检测到重放攻击 - TransactionNo: ${message.transactionNo}`);
        return;
      }

      if (!replayCheck.isTimestampValid) {
        logger.warn(`[DataCollector] 时间戳无效 - TransactionNo: ${message.transactionNo}`);
        return;
      }

      const processor = this.dataProcessors.get(dataTypeStr);
      if (processor) {
        const result = await processor(deviceId, message.data, message.timestamp, message.transactionNo, message.nonce);
        if (!result.success) {
          logger.error(`[DataCollector] 数据处理失败 - DeviceId: ${deviceId}, Error: ${result.error}`);
        }
      } else {
        logger.warn(`[DataCollector] 未找到数据类型处理器 - DataType: ${dataTypeStr}`);
      }
    } catch (error) {
      logger.error('[DataCollector] 处理数据消息错误', error);
    }
  }

  private async validateMessage(deviceId: string, message: IoTMessage): Promise<boolean> {
    try {
      const device = await Device.findOne({ deviceId }).select('+deviceSecret');
      if (!device) {
        logger.error(`[DataCollector] 设备不存在 - DeviceId: ${deviceId}`);
        return false;
      }

      if (!message.signature) {
        logger.error(`[DataCollector] 缺少签名 - DeviceId: ${deviceId}`);
        return false;
      }

      const messageWithoutSignature = { ...message };
      delete messageWithoutSignature.signature;

      const isValid = CryptoService.verifySignature(
        JSON.stringify(messageWithoutSignature),
        message.signature,
        device.deviceSecret
      );

      if (!isValid) {
        logger.error(`[DataCollector] 签名验证失败 - DeviceId: ${deviceId}`);
        return false;
      }

      const maxTimeDiff = config.security.nonceExpireSeconds * 1000;
      const timeDiff = Math.abs(Date.now() - message.timestamp);
      if (timeDiff > maxTimeDiff) {
        logger.error(`[DataCollector] 时间戳过期 - DeviceId: ${deviceId}, TimeDiff: ${timeDiff}ms`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[DataCollector] 验证消息错误', error);
      return false;
    }
  }

  private async processHeartbeat(
    deviceId: string,
    data: HeartbeatData,
    timestamp: number,
    transactionNo: string,
    nonce: string
  ): Promise<DataProcessResult> {
    try {
      logger.info(`[DataCollector] 处理心跳数据 - DeviceId: ${deviceId}`);

      const iotData = await IoTData.create({
        deviceId,
        type: 'heartbeat' as IoTDataType,
        timestamp: new Date(timestamp),
        isOffline: false,
        telemetry: {
          signalStrength: data.signalStrength,
          batteryLevel: data.batteryLevel,
          temperature: data.temperature
        },
        nonce,
        dataSignature: ''
      });

      await this.updateDeviceHeartbeat(deviceId, data);

      logger.info(`[DataCollector] 心跳数据已保存 - DeviceId: ${deviceId}, DataId: ${iotData._id}`);

      return {
        success: true,
        dataId: iotData._id.toString()
      };
    } catch (error) {
      logger.error(`[DataCollector] 处理心跳数据错误 - DeviceId: ${deviceId}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '处理心跳数据失败'
      };
    }
  }

  private async updateDeviceHeartbeat(deviceId: string, data: HeartbeatData): Promise<void> {
    try {
      await Device.updateOne(
        { deviceId },
        {
          $set: {
            lastHeartbeatAt: new Date(),
            lastOnlineAt: new Date(),
            status: 'online',
            'network.signalStrength': data.signalStrength,
            'network.networkType': data.networkStatus as any
          }
        }
      );
    } catch (error) {
      logger.error('[DataCollector] 更新设备心跳错误', error);
    }
  }

  private async processTelemetry(
    deviceId: string,
    data: TelemetryData,
    timestamp: number,
    transactionNo: string,
    nonce: string
  ): Promise<DataProcessResult> {
    try {
      logger.debug(`[DataCollector] 处理遥测数据 - DeviceId: ${deviceId}`);

      const processedData = this.validateAndSanitizeTelemetry(data);

      const iotData = await IoTData.create({
        deviceId,
        type: 'telemetry' as IoTDataType,
        timestamp: new Date(timestamp),
        isOffline: false,
        telemetry: processedData,
        nonce,
        dataSignature: ''
      });

      logger.debug(`[DataCollector] 遥测数据已保存 - DeviceId: ${deviceId}, DataId: ${iotData._id}`);

      return {
        success: true,
        dataId: iotData._id.toString()
      };
    } catch (error) {
      logger.error(`[DataCollector] 处理遥测数据错误 - DeviceId: ${deviceId}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '处理遥测数据失败'
      };
    }
  }

  private validateAndSanitizeTelemetry(data: TelemetryData): TelemetryData {
    const sanitized: TelemetryData = {};

    const allowedKeys = [
      'temperature', 'flowRate', 'totalFlow', 'pressure',
      'heaterPower', 'uvLightOn', 'valveOpen', 'isHeating',
      'energyConsumption', 'signalStrength', 'batteryLevel'
    ];

    for (const key of allowedKeys) {
      const value = data[key];
      if (value === null || value === undefined) continue;

      if (typeof value === 'number') {
        if (!isFinite(value)) continue;
        sanitized[key as keyof TelemetryData] = Math.round(value * 1000) / 1000 as any;
      } else if (typeof value === 'string' || typeof value === 'boolean') {
        sanitized[key as keyof TelemetryData] = value as any;
      }
    }

    return sanitized;
  }

  private async processEvent(
    deviceId: string,
    data: EventData,
    timestamp: number,
    transactionNo: string,
    nonce: string
  ): Promise<DataProcessResult> {
    try {
      logger.info(`[DataCollector] 处理事件数据 - DeviceId: ${deviceId}, EventType: ${data.eventType}`);

      const iotData = await IoTData.create({
        deviceId,
        type: 'event' as IoTDataType,
        timestamp: new Date(timestamp),
        isOffline: false,
        event: {
          eventCode: data.eventCode,
          eventMessage: data.description,
          eventData: data.eventData
        },
        nonce,
        dataSignature: ''
      });

      logger.info(`[DataCollector] 事件数据已保存 - DeviceId: ${deviceId}, DataId: ${iotData._id}`);

      return {
        success: true,
        dataId: iotData._id.toString()
      };
    } catch (error) {
      logger.error(`[DataCollector] 处理事件数据错误 - DeviceId: ${deviceId}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '处理事件数据失败'
      };
    }
  }

  private async processAlert(
    deviceId: string,
    data: AlertData,
    timestamp: number,
    transactionNo: string,
    nonce: string
  ): Promise<DataProcessResult> {
    try {
      logger.warn(`[DataCollector] 处理告警数据 - DeviceId: ${deviceId}, AlertCode: ${data.alertCode}, Level: ${data.alertLevel}`);

      const iotData = await IoTData.create({
        deviceId,
        type: 'alert' as IoTDataType,
        timestamp: new Date(timestamp),
        isOffline: false,
        alert: {
          alertLevel: data.alertLevel,
          alertCode: data.alertCode,
          alertMessage: data.description,
          resolved: data.resolved || false
        },
        nonce,
        dataSignature: ''
      });

      if (data.alertLevel === AlertLevel.CRITICAL || data.alertLevel === AlertLevel.ERROR) {
        await this.handleCriticalAlert(deviceId, data);
      }

      logger.info(`[DataCollector] 告警数据已保存 - DeviceId: ${deviceId}, DataId: ${iotData._id}`);

      return {
        success: true,
        dataId: iotData._id.toString()
      };
    } catch (error) {
      logger.error(`[DataCollector] 处理告警数据错误 - DeviceId: ${deviceId}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '处理告警数据失败'
      };
    }
  }

  private async handleCriticalAlert(deviceId: string, data: AlertData): Promise<void> {
    try {
      logger.error(`[DataCollector] 严重告警 - DeviceId: ${deviceId}, AlertCode: ${data.alertCode}`);

      await Device.updateOne(
        { deviceId },
        {
          $set: {
            status: 'fault',
            faultCode: data.alertCode,
            faultMessage: data.description
          }
        }
      );

    } catch (error) {
      logger.error('[DataCollector] 处理严重告警错误', error);
    }
  }

  public async processOfflineData(
    deviceId: string,
    dataList: Array<{
      dataType: DataType;
      data: any;
      timestamp: number;
      transactionNo: string;
      nonce: string;
    }>
  ): Promise<DataProcessResult[]> {
    const results: DataProcessResult[] = [];

    for (const item of dataList) {
      const processor = this.dataProcessors.get(item.dataType);
      if (processor) {
        const result = await processor(deviceId, item.data, item.timestamp, item.transactionNo, item.nonce);
        results.push(result);
      } else {
        results.push({
          success: false,
          error: `未找到数据类型处理器`
        });
      }
    }

    return results;
  }

  public async getLatestData(deviceId: string, dataType?: DataType, limit: number = 10): Promise<any[]> {
    const where: any = { deviceId };
    if (dataType) {
      where.type = dataType;
    }

    const dataList = await IoTData.find(where)
      .sort({ timestamp: -1 })
      .limit(limit);

    return dataList.map(d => ({
      id: d._id,
      dataType: d.type,
      telemetry: d.telemetry,
      event: d.event,
      alert: d.alert,
      timestamp: d.timestamp,
      isOffline: d.isOffline,
      createdAt: d.createdAt
    }));
  }

  public async getDataByTimeRange(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    dataType?: DataType
  ): Promise<any[]> {
    const where: any = {
      deviceId,
      timestamp: {
        $gte: startTime,
        $lte: endTime
      }
    };
    if (dataType) {
      where.type = dataType;
    }

    const dataList = await IoTData.find(where)
      .sort({ timestamp: 1 });

    return dataList.map(d => ({
      id: d._id,
      dataType: d.type,
      telemetry: d.telemetry,
      event: d.event,
      alert: d.alert,
      timestamp: d.timestamp,
      isOffline: d.isOffline,
      createdAt: d.createdAt
    }));
  }

  public async deleteOldData(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await IoTData.deleteMany({
      timestamp: {
        $lt: cutoffDate
      }
    });

    logger.info(`[DataCollector] 已删除 ${result.deletedCount} 条过期数据`);
    return result.deletedCount || 0;
  }

  public async getDataStatistics(deviceId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const statistics = {
      total: 0,
      byType: {} as Record<string, number>,
      alerts: {
        total: 0,
        byLevel: {} as Record<string, number>
      }
    };

    const dataList = await IoTData.find({
      deviceId,
      timestamp: {
        $gte: startDate
      }
    });

    for (const data of dataList) {
      statistics.total++;

      if (!statistics.byType[data.type]) {
        statistics.byType[data.type] = 0;
      }
      statistics.byType[data.type]++;

      if (data.type === 'alert' && data.alert) {
        statistics.alerts.total++;
        const level = data.alert.alertLevel;
        if (!statistics.alerts.byLevel[level]) {
          statistics.alerts.byLevel[level] = 0;
        }
        statistics.alerts.byLevel[level]++;
      }
    }

    return statistics;
  }
}

export const dataCollectorService = new DataCollectorService();
export default dataCollectorService;
