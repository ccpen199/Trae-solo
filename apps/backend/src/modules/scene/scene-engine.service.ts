import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneEntity } from '../../database/entities/scene.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { DeviceCommandEntity } from '../../database/entities/telemetry.entity';
import { SceneTriggerType, SceneConditionOperator, SceneActionType, SceneStatus } from '@iot/shared';
import { MqttService } from '../mqtt/mqtt.service';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class SceneEngineService {
  private readonly logger = new Logger(SceneEngineService.name);
  private readonly registeredScenes = new Map<string, SceneEntity>();
  private readonly cronTimers = new Map<string, NodeJS.Timeout>();
  private readonly timeTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(SceneEntity) private readonly sceneRepo: Repository<SceneEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(DeviceCommandEntity) private readonly commandRepo: Repository<DeviceCommandEntity>,
    private readonly mqttService: MqttService,
    private readonly cache: CacheService,
  ) {}

  registerScene(scene: SceneEntity) {
    this.unregisterScene(scene.id);
    this.registeredScenes.set(scene.id, scene);

    for (const trigger of scene.triggers) {
      if (trigger.type === SceneTriggerType.CRON && trigger.config.cron) {
        this.scheduleCronTrigger(scene.id, trigger.id, trigger.config.cron);
      } else if (trigger.type === SceneTriggerType.TIME && trigger.config.time) {
        this.scheduleTimeTrigger(scene.id, trigger.id, trigger.config.time);
      }
    }

    this.logger.log(`Scene registered: ${scene.id} (${scene.name})`);
  }

  unregisterScene(sceneId: string) {
    this.registeredScenes.delete(sceneId);

    const cronKeys = Array.from(this.cronTimers.keys()).filter(k => k.startsWith(sceneId));
    for (const key of cronKeys) {
      clearTimeout(this.cronTimers.get(key)!);
      this.cronTimers.delete(key);
    }

    const timeKeys = Array.from(this.timeTimers.keys()).filter(k => k.startsWith(sceneId));
    for (const key of timeKeys) {
      clearTimeout(this.timeTimers.get(key)!);
      this.timeTimers.delete(key);
    }
  }

  async handleDeviceStateChange(deviceId: string, propertyName: string, value: any) {
    const affectedScenes = Array.from(this.registeredScenes.values()).filter(scene =>
      scene.triggers.some(t =>
        t.type === SceneTriggerType.DEVICE_STATE &&
        t.config.deviceId === deviceId
      ) &&
      scene.conditions.some(c => c.field === propertyName || c.field === `${deviceId}.${propertyName}`)
    );

    for (const scene of affectedScenes) {
      const refreshed = await this.sceneRepo.findOne({ where: { id: scene.id } });
      if (!refreshed || refreshed.status !== SceneStatus.ENABLED) continue;

      const allConditionsMet = this.evaluateConditions(refreshed, deviceId, propertyName, value);
      if (allConditionsMet) {
        this.logger.log(`Scene triggered by device state: ${scene.name} (${deviceId}.${propertyName}=${value})`);
        await this.executeScene(refreshed);
      }
    }
  }

  async handleSensorTrigger(deviceId: string, sensorType: string, value: any) {
    const affectedScenes = Array.from(this.registeredScenes.values()).filter(scene =>
      scene.triggers.some(t =>
        t.type === SceneTriggerType.SENSOR &&
        t.config.deviceId === deviceId &&
        t.config.sensorType === sensorType
      )
    );

    for (const scene of affectedScenes) {
      const refreshed = await this.sceneRepo.findOne({ where: { id: scene.id } });
      if (!refreshed || refreshed.status !== SceneStatus.ENABLED) continue;

      const allConditionsMet = this.evaluateConditions(refreshed, deviceId, sensorType, value);
      if (allConditionsMet) {
        this.logger.log(`Scene triggered by sensor: ${scene.name}`);
        await this.executeScene(refreshed);
      }
    }
  }

  async executeScene(scene: SceneEntity, userId?: string): Promise<{ success: boolean; results: any[] }> {
    this.logger.log(`Executing scene: ${scene.name}`);
    const results: any[] = [];
    let overallSuccess = true;

    const sortedActions = [...scene.actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      if (action.delayMs && action.delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, action.delayMs));
      }

      try {
        const result = await this.executeAction(action, userId);
        results.push({ actionId: action.id, success: true, result });
      } catch (err: any) {
        this.logger.error(`Action failed: ${action.id} - ${err.message}`);
        results.push({ actionId: action.id, success: false, error: err.message });
        overallSuccess = false;
      }
    }

    await this.sceneRepo.update(scene.id, {
      lastExecutedAt: new Date(),
      executionCount: scene.executionCount + 1,
    });

    if (scene.autoLearning) {
      await this.updateLearningData(scene);
    }

    return { success: overallSuccess, results };
  }

  private async executeAction(action: any, userId?: string): Promise<any> {
    switch (action.type) {
      case SceneActionType.DEVICE_CONTROL:
        return this.executeDeviceControl(action.config, userId);
      case SceneActionType.DEVICE_DELAY:
        await new Promise(resolve => setTimeout(resolve, action.config.delayMs || 1000));
        return this.executeDeviceControl(action.config, userId);
      case SceneActionType.SCENE_ACTIVATE:
        const targetScene = await this.sceneRepo.findOne({ where: { id: action.config.sceneId } });
        if (targetScene) return this.executeScene(targetScene, userId);
        throw new Error(`Target scene not found: ${action.config.sceneId}`);
      case SceneActionType.NOTIFICATION:
        return this.sendNotification(action.config);
      case SceneActionType.HTTP_CALLBACK:
        return this.httpCallback(action.config);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeDeviceControl(config: any, userId?: string) {
    const device = await this.deviceRepo.findOne({ where: { id: config.deviceId } });
    if (!device) throw new Error(`Device not found: ${config.deviceId}`);

    const results: any[] = [];
    for (const [command, value] of Object.entries(config.commands)) {
      const params = typeof value === 'object' ? value : { [command]: value };
      const result = await this.mqttService.sendCommand(
        device.vendorId,
        device.vendorDeviceId,
        command,
        params,
      );
      results.push({ command, result });
    }

    const newProps = { ...device.properties, ...config.commands };
    await this.deviceRepo.update(config.deviceId, { properties: newProps });
    await this.cache.set(`device:status:${config.deviceId}`, { status: 'online', ...newProps }, 300);

    return results;
  }

  private async sendNotification(config: any) {
    this.logger.log(`Notification: ${config.title} - ${config.content}`);
    await this.cache.publish('notifications', {
      title: config.title,
      content: config.content,
      channels: config.channels || ['in_app', 'push'],
      timestamp: Date.now(),
    });
    return { sent: true };
  }

  private async httpCallback(config: any) {
    this.logger.log(`HTTP callback: ${config.method} ${config.url}`);
    return { called: true, url: config.url, method: config.method };
  }

  evaluateConditions(scene: SceneEntity, deviceId: string, field: string, value: any): boolean {
    if (!scene.conditions?.length) return true;

    return scene.conditions.every(condition => {
      let conditionField = condition.field;
      let compareValue = value;

      if (condition.field.includes('.')) {
        const [devId, prop] = condition.field.split('.');
        if (devId !== deviceId) return true;
        conditionField = prop;
      }

      return this.evaluateOperator(compareValue, condition.operator, condition.value, condition.value2);
    });
  }

  private evaluateOperator(actual: any, operator: SceneConditionOperator, expected: any, expected2?: any): boolean {
    switch (operator) {
      case SceneConditionOperator.EQ: return actual === expected;
      case SceneConditionOperator.NEQ: return actual !== expected;
      case SceneConditionOperator.GT: return actual > expected;
      case SceneConditionOperator.GTE: return actual >= expected;
      case SceneConditionOperator.LT: return actual < expected;
      case SceneConditionOperator.LTE: return actual <= expected;
      case SceneConditionOperator.IN: return Array.isArray(expected) && expected.includes(actual);
      case SceneConditionOperator.NOT_IN: return Array.isArray(expected) && !expected.includes(actual);
      case SceneConditionOperator.CONTAINS: return String(actual).includes(String(expected));
      case SceneConditionOperator.BETWEEN: return actual >= expected && actual <= (expected2 ?? actual);
      default: return false;
    }
  }

  private scheduleCronTrigger(sceneId: string, triggerId: string, cronExpression: string) {
    const key = `${sceneId}:${triggerId}`;
    const parts = cronExpression.split(' ');
    const intervalMs = this.cronToInterval(parts);
    if (intervalMs <= 0) return;

    const timer = setInterval(async () => {
      const scene = this.registeredScenes.get(sceneId);
      if (scene && scene.status === SceneStatus.ENABLED) {
        await this.executeScene(scene);
      }
    }, intervalMs);

    this.cronTimers.set(key, timer);
  }

  private scheduleTimeTrigger(sceneId: string, triggerId: string, time: string) {
    const key = `${sceneId}:${triggerId}`;
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const delay = target.getTime() - now.getTime();

    const timer = setTimeout(async () => {
      const scene = this.registeredScenes.get(sceneId);
      if (scene && scene.status === SceneStatus.ENABLED) {
        await this.executeScene(scene);
      }
      this.scheduleTimeTrigger(sceneId, triggerId, time);
    }, delay);

    this.timeTimers.set(key, timer);
  }

  private cronToInterval(parts: string[]): number {
    if (parts.length < 5) return 60000;
    if (parts[0] === '*') return 60000;
    return parseInt(parts[0], 10) * 60000;
  }

  private async updateLearningData(scene: SceneEntity) {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    const learningData = scene.learningData || { optimalTriggerTimes: {}, usageCount: 0, lastWeekStats: [] };
    learningData.usageCount = (learningData.usageCount || 0) + 1;

    const hourKey = `${dayOfWeek}-${hour}`;
    learningData.optimalTriggerTimes[hourKey] = (learningData.optimalTriggerTimes[hourKey] || 0) + 1;

    await this.sceneRepo.update(scene.id, { learningData });
  }
}
