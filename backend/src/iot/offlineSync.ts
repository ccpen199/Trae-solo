import { config } from '@config/index';
import { Device } from '@models/Device';
import { IoTData, IoTDataType } from '@models/IoTData';
import { CryptoService } from '@security/crypto';
import { AntiReplayProtection } from '@security/antiReplay';
import { DeviceAuthService } from '@security/deviceAuth';
import { logger } from '@utils/logger';
import { mqttClient } from './mqttClient';
import { dataCollectorService, DataType, IoTMessage } from './dataCollector';

export interface OfflineDataItem {
  dataType: DataType;
  data: Record<string, any>;
  timestamp: number;
  transactionNo: string;
  nonce: string;
  signature?: string;
}

export interface OfflineSyncMessage {
  deviceId: string;
  syncId: string;
  timestamp: number;
  dataCount: number;
  data: OfflineDataItem[];
  signature?: string;
  startTimestamp: number;
  endTimestamp: number;
  nonce: string;
}

export interface SyncResult {
  success: boolean;
  syncId: string;
  totalCount: number;
  successCount: number;
  duplicateCount: number;
  failedCount: number;
  errors?: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecordId?: string;
  reason?: string;
}

interface SyncProgress {
  syncId: string;
  deviceId: string;
  totalItems: number;
  processedItems: number;
  startTime: number;
  status: 'processing' | 'completed' | 'failed';
}

class OfflineSyncService {
  private syncInProgress: Map<string, SyncProgress> = new Map();
  private maxSyncBatchSize: number = 1000;
  private maxSyncAgeDays: number = 90;

  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    const topic = 'device/+/offline/sync';
    mqttClient.subscribe(topic, this.handleOfflineSync.bind(this));
  }

  public async handleOfflineSync(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];

      logger.info(`[OfflineSync] 收到离线同步请求 - DeviceId: ${deviceId}`);

      const syncMessage: OfflineSyncMessage = JSON.parse(payload.toString());

      const isValid = await this.validateSyncMessage(deviceId, syncMessage);
      if (!isValid) {
        logger.error(`[OfflineSync] 同步消息验证失败 - DeviceId: ${deviceId}, SyncId: ${syncMessage.syncId}`);
        await this.sendSyncResponse(deviceId, syncMessage.syncId, {
          success: false,
          syncId: syncMessage.syncId,
          totalCount: syncMessage.dataCount,
          successCount: 0,
          duplicateCount: 0,
          failedCount: syncMessage.dataCount,
          errors: ['消息验证失败']
        });
        return;
      }

      const syncResult = await this.processSyncData(deviceId, syncMessage);

      await this.sendSyncResponse(deviceId, syncMessage.syncId, syncResult);

      logger.info(`[OfflineSync] 同步完成 - DeviceId: ${deviceId}, SyncId: ${syncMessage.syncId}, ` +
        `成功: ${syncResult.successCount}, 重复: ${syncResult.duplicateCount}, 失败: ${syncResult.failedCount}`);
    } catch (error) {
      logger.error('[OfflineSync] 处理离线同步错误', error);
    }
  }

  private async validateSyncMessage(deviceId: string, message: OfflineSyncMessage): Promise<boolean> {
    try {
      const device = await Device.findOne({ deviceId }).select('+deviceSecret');
      if (!device) {
        logger.error(`[OfflineSync] 设备不存在 - DeviceId: ${deviceId}`);
        return false;
      }

      if (!message.signature) {
        logger.error(`[OfflineSync] 缺少签名 - SyncId: ${message.syncId}`);
        return false;
      }

      if (message.deviceId !== deviceId) {
        logger.error(`[OfflineSync] DeviceId 不匹配 - Topic: ${deviceId}, Message: ${message.deviceId}`);
        return false;
      }

      if (message.data.length !== message.dataCount) {
        logger.error(`[OfflineSync] 数据数量不匹配 - Count: ${message.dataCount}, Actual: ${message.data.length}`);
        return false;
      }

      if (message.data.length > this.maxSyncBatchSize) {
        logger.error(`[OfflineSync] 批次大小超限 - Size: ${message.data.length}, Max: ${this.maxSyncBatchSize}`);
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
        logger.error(`[OfflineSync] 签名验证失败 - SyncId: ${message.syncId}`);
        return false;
      }

      const maxAge = this.maxSyncAgeDays * 24 * 60 * 60 * 1000;
      const oldestAllowed = Date.now() - maxAge;
      if (message.startTimestamp < oldestAllowed) {
        logger.warn(`[OfflineSync] 同步数据超过最大保留期限 - SyncId: ${message.syncId}`);
      }

      return true;
    } catch (error) {
      logger.error('[OfflineSync] 验证同步消息错误', error);
      return false;
    }
  }

  private async processSyncData(deviceId: string, syncMessage: OfflineSyncMessage): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncId: syncMessage.syncId,
      totalCount: syncMessage.dataCount,
      successCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      errors: []
    };

    const progress: SyncProgress = {
      syncId: syncMessage.syncId,
      deviceId,
      totalItems: syncMessage.dataCount,
      processedItems: 0,
      startTime: Date.now(),
      status: 'processing'
    };
    this.syncInProgress.set(syncMessage.syncId, progress);

    const sortedData = this.sortDataByTimestamp(syncMessage.data);

    const processPromises = sortedData.map(async (item, index) => {
      try {
        const duplicateCheck = await this.checkForDuplicate(deviceId, item);
        if (duplicateCheck.isDuplicate) {
          result.duplicateCount++;
          logger.debug(`[OfflineSync] 检测到重复数据 - TransactionNo: ${item.transactionNo}, Reason: ${duplicateCheck.reason}`);
          return;
        }

        const replayCheck = await AntiReplayProtection.checkReplayAttack(
          deviceId,
          item.nonce,
          Math.floor(item.timestamp / 1000)
        );

        if (replayCheck.isReplay) {
          result.duplicateCount++;
          logger.warn(`[OfflineSync] 检测到重放数据 - TransactionNo: ${item.transactionNo}`);
          return;
        }

        if (!replayCheck.isTimestampValid) {
          result.duplicateCount++;
          logger.warn(`[OfflineSync] 时间戳无效 - TransactionNo: ${item.transactionNo}`);
          return;
        }

        const itemIsValid = await this.validateDataItem(deviceId, item);
        if (!itemIsValid) {
          result.failedCount++;
          result.errors!.push(`数据项验证失败 - Index: ${index}, TransactionNo: ${item.transactionNo}`);
          return;
        }

        const processResult = await dataCollectorService.processOfflineData(deviceId, [{
          dataType: item.dataType,
          data: item.data,
          timestamp: item.timestamp,
          transactionNo: item.transactionNo,
          nonce: item.nonce
        }]);

        if (processResult[0].success) {
          result.successCount++;
        } else {
          result.failedCount++;
          result.errors!.push(`处理失败 - TransactionNo: ${item.transactionNo}, Error: ${processResult[0].error}`);
        }
      } catch (error) {
        result.failedCount++;
        result.errors!.push(`处理异常 - TransactionNo: ${item.transactionNo}, Error: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        progress.processedItems++;
      }
    });

    await Promise.all(processPromises);

    progress.status = result.failedCount === 0 ? 'completed' : 'failed';

    await this.recordSyncResult(deviceId, syncMessage, result);

    setTimeout(() => {
      this.syncInProgress.delete(syncMessage.syncId);
    }, 3600000);

    if (result.failedCount > 0) {
      result.success = false;
    }

    return result;
  }

  private async recordSyncResult(
    deviceId: string,
    syncMessage: OfflineSyncMessage,
    result: SyncResult
  ): Promise<void> {
    try {
      await IoTData.create({
        deviceId,
        type: 'event' as IoTDataType,
        timestamp: new Date(),
        isOffline: false,
        event: {
          eventCode: 'OFFLINE_SYNC_COMPLETE',
          eventMessage: '离线同步完成',
          eventData: {
            syncId: syncMessage.syncId,
            totalCount: result.totalCount,
            successCount: result.successCount,
            duplicateCount: result.duplicateCount,
            failedCount: result.failedCount,
            startTimestamp: syncMessage.startTimestamp,
            endTimestamp: syncMessage.endTimestamp
          }
        },
        nonce: syncMessage.nonce,
        dataSignature: ''
      });
    } catch (error) {
      logger.error('[OfflineSync] 记录同步结果错误', error);
    }
  }

  private sortDataByTimestamp(data: OfflineDataItem[]): OfflineDataItem[] {
    return [...data].sort((a, b) => a.timestamp - b.timestamp);
  }

  private async checkForDuplicate(deviceId: string, item: OfflineDataItem): Promise<DuplicateCheckResult> {
    try {
      const existingByNonce = await IoTData.findOne({
        deviceId,
        nonce: item.nonce
      });

      if (existingByNonce) {
        return {
          isDuplicate: true,
          existingRecordId: existingByNonce._id.toString(),
          reason: 'nonce 已存在'
        };
      }

      const timeWindow = 1000;
      const existingByTimestamp = await IoTData.findOne({
        deviceId,
        type: item.dataType as IoTDataType,
        timestamp: {
          $gte: new Date(item.timestamp - timeWindow),
          $lte: new Date(item.timestamp + timeWindow)
        }
      });

      if (existingByTimestamp) {
        const dataMatch = this.compareDataContent(item.data, existingByTimestamp.telemetry || existingByTimestamp.event || existingByTimestamp.alert || {});
        if (dataMatch) {
          return {
            isDuplicate: true,
            existingRecordId: existingByTimestamp._id.toString(),
            reason: '时间窗口内数据内容重复'
          };
        }
      }

      return {
        isDuplicate: false
      };
    } catch (error) {
      logger.error('[OfflineSync] 检查重复数据错误', error);
      return {
        isDuplicate: false
      };
    }
  }

  private compareDataContent(data1: Record<string, any>, data2: Record<string, any>): boolean {
    const keys1 = Object.keys(data1).sort();
    const keys2 = Object.keys(data2).sort();

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }

      const val1 = data1[key];
      const val2 = data2[key];

      if (typeof val1 === 'number' && typeof val2 === 'number') {
        if (Math.abs(val1 - val2) > 0.001) {
          return false;
        }
      } else if (val1 !== val2) {
        return false;
      }
    }

    return true;
  }

  private async validateDataItem(deviceId: string, item: OfflineDataItem): Promise<boolean> {
    try {
      if (!item.transactionNo || !item.timestamp || !item.dataType || !item.nonce) {
        logger.error(`[OfflineSync] 数据项缺少必要字段 - TransactionNo: ${item.transactionNo}`);
        return false;
      }

      const device = await Device.findOne({ deviceId }).select('+deviceSecret');
      if (!device) {
        return false;
      }

      if (item.signature) {
        const itemWithoutSignature = { ...item };
        delete itemWithoutSignature.signature;

        const isValid = CryptoService.verifySignature(
          JSON.stringify(itemWithoutSignature),
          item.signature,
          device.deviceSecret
        );

        if (!isValid) {
          logger.error(`[OfflineSync] 数据项签名验证失败 - TransactionNo: ${item.transactionNo}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('[OfflineSync] 验证数据项错误', error);
      return false;
    }
  }

  private async sendSyncResponse(deviceId: string, syncId: string, result: SyncResult): Promise<void> {
    try {
      const topic = `device/${deviceId}/offline/sync/response`;

      const nonce = CryptoService.generateNonce();
      const timestamp = Date.now();

      const { syncId: resultSyncId, ...resultWithoutSyncId } = result;
      const response: any = {
        syncId,
        timestamp,
        nonce,
        ...resultWithoutSyncId
      };

      const device = await Device.findOne({ deviceId }).select('+deviceSecret');
      if (device && device.deviceSecret) {
        const responseWithoutSignature = { ...response };
        const signature = CryptoService.hmacSHA256WithDeviceSecret(
          device.deviceSecret,
          JSON.stringify(responseWithoutSignature)
        );
        response.signature = signature;
      }

      await mqttClient.publish(topic, response, 1);

      logger.debug(`[OfflineSync] 同步响应已发送 - DeviceId: ${deviceId}, SyncId: ${syncId}`);
    } catch (error) {
      logger.error('[OfflineSync] 发送同步响应错误', error);
    }
  }

  public getSyncProgress(syncId: string): SyncProgress | null {
    return this.syncInProgress.get(syncId) || null;
  }

  public getActiveSyncCount(): number {
    return this.syncInProgress.size;
  }

  public async getDeviceSyncHistory(deviceId: string, limit: number = 20): Promise<any[]> {
    const dataList = await IoTData.find({
      deviceId,
      'event.eventCode': 'OFFLINE_SYNC_COMPLETE'
    })
      .sort({ timestamp: -1 })
      .limit(limit);

    return dataList.map(d => ({
      id: d._id,
      syncId: d.event?.eventData?.syncId,
      totalCount: d.event?.eventData?.totalCount,
      successCount: d.event?.eventData?.successCount,
      duplicateCount: d.event?.eventData?.duplicateCount,
      failedCount: d.event?.eventData?.failedCount,
      timestamp: d.timestamp,
      createdAt: d.createdAt
    }));
  }

  public async cleanupOldData(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await IoTData.deleteMany({
      'event.eventCode': 'OFFLINE_SYNC_COMPLETE',
      timestamp: {
        $lt: cutoffDate
      }
    });

    logger.info(`[OfflineSync] 已清理 ${result.deletedCount} 条过期离线同步记录`);
    return result.deletedCount || 0;
  }

  public async triggerSync(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        return { success: false, message: '设备不存在' };
      }

      const topic = `device/${deviceId}/offline/sync/request`;
      const nonce = CryptoService.generateNonce();
      const message = {
        requestId: nonce,
        timestamp: Date.now(),
        nonce,
        maxBatchSize: this.maxSyncBatchSize
      };

      await mqttClient.publish(topic, message, 1);

      logger.info(`[OfflineSync] 已触发设备同步 - DeviceId: ${deviceId}`);

      return { success: true, message: '同步请求已发送' };
    } catch (error) {
      logger.error('[OfflineSync] 触发同步错误', error);
      return { success: false, message: error instanceof Error ? error.message : '触发同步失败' };
    }
  }

  public getMaxSyncBatchSize(): number {
    return this.maxSyncBatchSize;
  }

  public setMaxSyncBatchSize(size: number): void {
    if (size > 0 && size <= 5000) {
      this.maxSyncBatchSize = size;
      logger.info(`[OfflineSync] 最大同步批次大小已设置为: ${size}`);
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
