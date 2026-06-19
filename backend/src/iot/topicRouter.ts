import { config } from '@config/index';
import { Device } from '@models/Device';
import { IoTData, IoTDataType } from '@models/IoTData';
import { DeviceCommand, DeviceCommandStatus } from '@models/DeviceCommand';
import { CryptoService } from '@security/crypto';
import { AntiReplayProtection } from '@security/antiReplay';
import { DeviceAuthService, DeviceAuthRequest } from '@security/deviceAuth';
import { logger } from '@utils/logger';
import { mqttClient, MQTTMessageHandler } from './mqttClient';
import { dataCollectorService } from './dataCollector';
import { deviceCommandService } from './deviceCommands';
import { offlineSyncService } from './offlineSync';

export enum TopicCategory {
  HEARTBEAT = 'heartbeat',
  TELEMETRY = 'telemetry',
  EVENT = 'event',
  ALERT = 'alert',
  COMMAND = 'command',
  COMMAND_RESPONSE = 'command_response',
  OFFLINE_SYNC = 'offline_sync',
  OFFLINE_SYNC_RESPONSE = 'offline_sync_response',
  OFFLINE_SYNC_REQUEST = 'offline_sync_request',
  DEVICE_REGISTER = 'device_register',
  DEVICE_AUTH = 'device_auth',
  UNKNOWN = 'unknown'
}

export interface RouteRule {
  pattern: string;
  category: TopicCategory;
  handler: MQTTMessageHandler;
  description: string;
  enabled: boolean;
}

export interface RouteMatchResult {
  matched: boolean;
  category: TopicCategory;
  deviceId?: string;
  rule?: RouteRule;
}

export interface TopicStats {
  totalMessages: number;
  byCategory: Record<TopicCategory, number>;
  byDevice: Record<string, number>;
  errors: number;
  lastMessageTime?: number;
}

class TopicRouter {
  private routeRules: RouteRule[] = [];
  private stats: TopicStats = {
    totalMessages: 0,
    byCategory: {} as Record<TopicCategory, number>,
    byDevice: {},
    errors: 0
  };
  private wildCardSubscriptions: Set<string> = new Set();

  constructor() {
    this.initializeRules();
    this.setupWildcardSubscriptions();
    this.initializeStats();
  }

  private initializeStats(): void {
    for (const category of Object.values(TopicCategory)) {
      this.stats.byCategory[category] = 0;
    }
  }

  private initializeRules(): void {
    this.routeRules = [
      {
        pattern: 'device/+/heartbeat',
        category: TopicCategory.HEARTBEAT,
        handler: dataCollectorService.handleDataMessage.bind(dataCollectorService),
        description: '设备心跳数据',
        enabled: true
      },
      {
        pattern: 'device/+/telemetry',
        category: TopicCategory.TELEMETRY,
        handler: dataCollectorService.handleDataMessage.bind(dataCollectorService),
        description: '设备遥测数据',
        enabled: true
      },
      {
        pattern: 'device/+/event',
        category: TopicCategory.EVENT,
        handler: dataCollectorService.handleDataMessage.bind(dataCollectorService),
        description: '设备事件数据',
        enabled: true
      },
      {
        pattern: 'device/+/alert',
        category: TopicCategory.ALERT,
        handler: dataCollectorService.handleDataMessage.bind(dataCollectorService),
        description: '设备告警数据',
        enabled: true
      },
      {
        pattern: 'device/+/command/response',
        category: TopicCategory.COMMAND_RESPONSE,
        handler: this.handleCommandResponse.bind(this),
        description: '指令响应',
        enabled: true
      },
      {
        pattern: 'device/+/offline/sync',
        category: TopicCategory.OFFLINE_SYNC,
        handler: offlineSyncService.handleOfflineSync.bind(offlineSyncService),
        description: '离线数据同步',
        enabled: true
      },
      {
        pattern: 'device/+/offline/sync/response',
        category: TopicCategory.OFFLINE_SYNC_RESPONSE,
        handler: this.handleOfflineSyncResponse.bind(this),
        description: '离线同步响应',
        enabled: true
      },
      {
        pattern: 'device/+/offline/sync/request',
        category: TopicCategory.OFFLINE_SYNC_REQUEST,
        handler: this.handleOfflineSyncRequest.bind(this),
        description: '离线同步请求',
        enabled: true
      },
      {
        pattern: 'device/+/register',
        category: TopicCategory.DEVICE_REGISTER,
        handler: this.handleDeviceRegister.bind(this),
        description: '设备注册',
        enabled: true
      },
      {
        pattern: 'device/+/auth',
        category: TopicCategory.DEVICE_AUTH,
        handler: this.handleDeviceAuth.bind(this),
        description: '设备认证',
        enabled: true
      }
    ];
  }

  private setupWildcardSubscriptions(): void {
    const wildcardTopic = 'device/+/+';
    this.wildCardSubscriptions.add(wildcardTopic);

    mqttClient.subscribe(wildcardTopic, this.routeMessage.bind(this));
    logger.info(`[TopicRouter] 通配符订阅已设置: ${wildcardTopic}`);

    const offlineSyncTopic = 'device/+/offline/+';
    this.wildCardSubscriptions.add(offlineSyncTopic);
    mqttClient.subscribe(offlineSyncTopic, this.routeMessage.bind(this));
    logger.info(`[TopicRouter] 离线同步通配符订阅已设置: ${offlineSyncTopic}`);

    const commandResponseTopic = 'device/+/command/+';
    this.wildCardSubscriptions.add(commandResponseTopic);
    mqttClient.subscribe(commandResponseTopic, this.routeMessage.bind(this));
    logger.info(`[TopicRouter] 指令响应通配符订阅已设置: ${commandResponseTopic}`);
  }

  public async routeMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      logger.debug(`[TopicRouter] 路由消息 - Topic: ${topic}`);

      const matchResult = this.matchTopic(topic);

      if (!matchResult.matched || !matchResult.rule) {
        logger.warn(`[TopicRouter] 未找到匹配的路由规则 - Topic: ${topic}`);
        this.updateStats(TopicCategory.UNKNOWN, matchResult.deviceId);
        return;
      }

      if (!matchResult.rule.enabled) {
        logger.warn(`[TopicRouter] 路由规则已禁用 - Topic: ${topic}, Category: ${matchResult.category}`);
        return;
      }

      const preProcessResult = await this.preProcessMessage(topic, payload, matchResult);
      if (!preProcessResult.success) {
        logger.error(`[TopicRouter] 消息预处理失败 - Topic: ${topic}, Error: ${preProcessResult.error}`);
        this.stats.errors++;
        return;
      }

      this.updateStats(matchResult.category, matchResult.deviceId);

      const handler = matchResult.rule.handler;
      try {
        const result = handler(topic, payload);
        if (result instanceof Promise) {
          result.catch((error) => {
            logger.error(`[TopicRouter] 处理器执行错误 - Topic: ${topic}`, error);
            this.stats.errors++;
          });
        }
      } catch (error) {
        logger.error(`[TopicRouter] 处理器执行错误 - Topic: ${topic}`, error);
        this.stats.errors++;
      }
    } catch (error) {
      logger.error('[TopicRouter] 路由消息错误', error);
      this.stats.errors++;
    }
  }

  private matchTopic(topic: string): RouteMatchResult {
    for (const rule of this.routeRules) {
      if (this.topicMatches(rule.pattern, topic)) {
        const topicParts = topic.split('/');
        const deviceId = topicParts.length > 1 ? topicParts[1] : undefined;

        return {
          matched: true,
          category: rule.category,
          deviceId,
          rule
        };
      }
    }

    return {
      matched: false,
      category: TopicCategory.UNKNOWN
    };
  }

  private topicMatches(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '#') {
        return true;
      }
      if (patternParts[i] === '+') {
        if (i >= topicParts.length) {
          return false;
        }
        continue;
      }
      if (i >= topicParts.length || patternParts[i] !== topicParts[i]) {
        return false;
      }
    }

    return patternParts.length === topicParts.length;
  }

  private async preProcessMessage(
    topic: string,
    payload: Buffer,
    matchResult: RouteMatchResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!matchResult.deviceId) {
        return { success: false, error: '无法提取设备ID' };
      }

      const device = await Device.findOne({ deviceId: matchResult.deviceId });
      if (!device) {
        if (matchResult.category === TopicCategory.DEVICE_REGISTER ||
            matchResult.category === TopicCategory.DEVICE_AUTH) {
          return { success: true };
        }
        logger.warn(`[TopicRouter] 设备不存在 - DeviceId: ${matchResult.deviceId}, Topic: ${topic}`);
        return { success: true };
      }

      if (matchResult.category !== TopicCategory.DEVICE_REGISTER &&
          matchResult.category !== TopicCategory.DEVICE_AUTH) {
        const message = JSON.parse(payload.toString());
        const token = message.token;

        if (token) {
          const isAuthed = await DeviceAuthService.verifySessionToken(matchResult.deviceId, token);
          if (!isAuthed) {
            logger.warn(`[TopicRouter] 设备未认证 - DeviceId: ${matchResult.deviceId}, Topic: ${topic}`);
            return { success: false, error: '设备未认证' };
          }
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '预处理失败'
      };
    }
  }

  private updateStats(category: TopicCategory, deviceId?: string): void {
    this.stats.totalMessages++;
    this.stats.byCategory[category]++;
    this.stats.lastMessageTime = Date.now();

    if (deviceId) {
      if (!this.stats.byDevice[deviceId]) {
        this.stats.byDevice[deviceId] = 0;
      }
      this.stats.byDevice[deviceId]++;
    }
  }

  private async handleCommandResponse(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];

      logger.debug(`[TopicRouter] 处理指令响应 - DeviceId: ${deviceId}`);

      const response = JSON.parse(payload.toString());

      const commandId = response.commandId;
      if (commandId && response.nonce) {
        const isReplay = await AntiReplayProtection.checkReplayAttack(
          deviceId,
          response.nonce,
          Math.floor(response.timestamp / 1000)
        );

        if (isReplay.isReplay) {
          logger.warn(`[TopicRouter] 检测到指令响应重放 - CommandId: ${commandId}`);
          return;
        }
      }

      await DeviceCommand.updateOne(
        { commandId },
        {
          $set: {
            status: response.status as DeviceCommandStatus,
            result: response.result,
            errorCode: response.errorCode,
            errorMessage: response.errorMessage,
            progress: response.progress,
            completedAt: response.status === 'success' || response.status === 'failed' ? new Date() : undefined
          }
        }
      );
    } catch (error) {
      logger.error('[TopicRouter] 处理指令响应错误', error);
    }
  }

  private async handleOfflineSyncResponse(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];

      logger.debug(`[TopicRouter] 处理离线同步响应 - DeviceId: ${deviceId}`);

      const response = JSON.parse(payload.toString());

      await IoTData.create({
        deviceId,
        type: 'event' as IoTDataType,
        timestamp: new Date(response.timestamp || Date.now()),
        isOffline: false,
        event: {
          eventCode: 'OFFLINE_SYNC_RESPONSE',
          eventMessage: '离线同步响应',
          eventData: response
        },
        nonce: response.nonce || CryptoService.generateNonce(),
        dataSignature: ''
      });
    } catch (error) {
      logger.error('[TopicRouter] 处理离线同步响应错误', error);
    }
  }

  private async handleOfflineSyncRequest(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];

      logger.info(`[TopicRouter] 收到离线同步请求 - DeviceId: ${deviceId}`);

      const request = JSON.parse(payload.toString());

      const device = await Device.findOne({ deviceId });
      if (!device) {
        logger.error(`[TopicRouter] 设备不存在 - DeviceId: ${deviceId}`);
        return;
      }

      const nonce = CryptoService.generateNonce();
      const timestamp = Date.now();

      const responseTopic = `device/${deviceId}/offline/sync/request/response`;
      const response: any = {
        requestId: request.requestId,
        timestamp,
        nonce,
        allowed: true,
        maxBatchSize: offlineSyncService.getMaxSyncBatchSize(),
        serverTime: Date.now()
      };

      const deviceWithSecret = await Device.findOne({ deviceId }).select('+deviceSecret');
      if (deviceWithSecret && deviceWithSecret.deviceSecret) {
        const responseWithoutSignature = { ...response };
        const signature = CryptoService.hmacSHA256WithDeviceSecret(
          deviceWithSecret.deviceSecret,
          JSON.stringify(responseWithoutSignature)
        );
        response.signature = signature;
      }

      await mqttClient.publish(responseTopic, response, 1);

      logger.info(`[TopicRouter] 已响应离线同步请求 - DeviceId: ${deviceId}`);
    } catch (error) {
      logger.error('[TopicRouter] 处理离线同步请求错误', error);
    }
  }

  private async handleDeviceRegister(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];

      logger.info(`[TopicRouter] 处理设备注册 - DeviceId: ${deviceId}`);

      const registerData = JSON.parse(payload.toString());

      const signature = registerData.signature;
      if (!signature) {
        logger.error(`[TopicRouter] 注册消息缺少签名 - DeviceId: ${deviceId}`);
        return;
      }

      const dataWithoutSignature = { ...registerData };
      delete dataWithoutSignature.signature;

      const isValid = CryptoService.verifySignature(
        JSON.stringify(dataWithoutSignature),
        signature,
        registerData.deviceSecret
      );

      if (!isValid) {
        logger.error(`[TopicRouter] 注册消息签名验证失败 - DeviceId: ${deviceId}`);
        return;
      }

      const existingDevice = await Device.findOne({ deviceId });
      if (existingDevice) {
        logger.warn(`[TopicRouter] 设备已存在 - DeviceId: ${deviceId}`);
        return;
      }

      logger.info(`[TopicRouter] 设备注册请求已接收 - DeviceId: ${deviceId}`);

      const responseTopic = `device/${deviceId}/register/response`;
      const nonce = CryptoService.generateNonce();
      const response = {
        deviceId,
        timestamp: Date.now(),
        nonce,
        success: true,
        serverTime: Date.now()
      };

      await mqttClient.publish(responseTopic, response, 1);
    } catch (error) {
      logger.error('[TopicRouter] 处理设备注册错误', error);
    }
  }

  private async handleDeviceAuth(topic: string, payload: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];

      logger.debug(`[TopicRouter] 处理设备认证 - DeviceId: ${deviceId}`);

      const authData: DeviceAuthRequest = JSON.parse(payload.toString());
      authData.deviceId = deviceId;

      const authResult = await DeviceAuthService.authenticateDevice(authData);

      const responseTopic = `device/${deviceId}/auth/response`;
      const response = {
        deviceId,
        timestamp: Date.now(),
        success: authResult.success,
        token: authResult.token,
        serverNonce: authResult.serverNonce,
        serverTimestamp: authResult.serverTimestamp,
        serverSignature: authResult.serverSignature,
        error: authResult.error,
        serverTime: Date.now()
      };

      await mqttClient.publish(responseTopic, response, 1);
    } catch (error) {
      logger.error('[TopicRouter] 处理设备认证错误', error);
    }
  }

  public addRouteRule(rule: RouteRule): void {
    const existingIndex = this.routeRules.findIndex(r => r.pattern === rule.pattern);
    if (existingIndex > -1) {
      this.routeRules[existingIndex] = rule;
      logger.info(`[TopicRouter] 路由规则已更新: ${rule.pattern}`);
    } else {
      this.routeRules.push(rule);
      logger.info(`[TopicRouter] 路由规则已添加: ${rule.pattern}`);
    }
  }

  public removeRouteRule(pattern: string): boolean {
    const index = this.routeRules.findIndex(r => r.pattern === pattern);
    if (index > -1) {
      this.routeRules.splice(index, 1);
      logger.info(`[TopicRouter] 路由规则已删除: ${pattern}`);
      return true;
    }
    return false;
  }

  public enableRouteRule(pattern: string): boolean {
    const rule = this.routeRules.find(r => r.pattern === pattern);
    if (rule) {
      rule.enabled = true;
      logger.info(`[TopicRouter] 路由规则已启用: ${pattern}`);
      return true;
    }
    return false;
  }

  public disableRouteRule(pattern: string): boolean {
    const rule = this.routeRules.find(r => r.pattern === pattern);
    if (rule) {
      rule.enabled = false;
      logger.info(`[TopicRouter] 路由规则已禁用: ${pattern}`);
      return true;
    }
    return false;
  }

  public getRouteRules(): RouteRule[] {
    return [...this.routeRules];
  }

  public getStats(): TopicStats {
    return {
      ...this.stats,
      byCategory: { ...this.stats.byCategory },
      byDevice: { ...this.stats.byDevice }
    };
  }

  public resetStats(): void {
    this.stats = {
      totalMessages: 0,
      byCategory: {} as Record<TopicCategory, number>,
      byDevice: {},
      errors: 0
    };
    this.initializeStats();
    logger.info('[TopicRouter] 统计数据已重置');
  }

  public getTopicCategory(topic: string): TopicCategory {
    const matchResult = this.matchTopic(topic);
    return matchResult.category;
  }

  public extractDeviceId(topic: string): string | null {
    const topicParts = topic.split('/');
    if (topicParts.length > 1 && topicParts[0] === 'device') {
      return topicParts[1];
    }
    return null;
  }
}

export const topicRouter = new TopicRouter();
export default topicRouter;
