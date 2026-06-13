import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneEntity } from '../../database/entities/scene.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { UserBehaviorLogEntity } from '../../database/entities/telemetry.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { CacheService } from '../redis/cache.service';
import { DeviceCategory, DeviceCapability } from '@iot/shared';
import { SceneTriggerType, SceneActionType, SceneStatus } from '@iot/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    @InjectRepository(SceneEntity) private readonly sceneRepo: Repository<SceneEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(UserBehaviorLogEntity) private readonly behaviorRepo: Repository<UserBehaviorLogEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    private readonly cache: CacheService,
  ) {}

  @Cron('0 0 3 * * *')
  async runDailyLearning() {
    this.logger.log('Starting daily user habit learning...');
    const homes = await this.homeRepo.find();

    for (const home of homes) {
      try {
        await this.learnForHome(home.id);
      } catch (err: any) {
        this.logger.error(`Learning failed for home ${home.id}: ${err.message}`);
      }
    }
    this.logger.log('Daily learning completed');
  }

  private async learnForHome(homeId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const behaviors = await this.behaviorRepo
      .createQueryBuilder('b')
      .where('b.homeId = :homeId', { homeId })
      .andWhere('b.createdAt >= :weekAgo', { weekAgo })
      .orderBy('b.createdAt', 'ASC')
      .getMany();

    const scenes = await this.sceneRepo.find({ where: { homeId } });

    const optimizedScenes = await this.analyzeSceneUsage(scenes, behaviors);
    const suggestions = await this.generateSceneSuggestions(homeId, behaviors);

    await this.cache.set(`learning:${homeId}:suggestions`, {
      optimizedScenes,
      suggestions,
      generatedAt: new Date(),
    }, 86400);

    return { optimizedScenes, suggestions };
  }

  private async analyzeSceneUsage(scenes: SceneEntity[], behaviors: UserBehaviorLogEntity[]) {
    const optimized: any[] = [];

    for (const scene of scenes) {
      if (!scene.autoLearning || !scene.learningData) continue;

      const optimalTimes = scene.learningData.optimalTriggerTimes || {};
      const entries = Object.entries(optimalTimes).sort((a, b) => (b[1] as number) - (a[1] as number));

      if (entries.length < 3) continue;

      const [bestKey, bestCount] = entries[0];
      const [dow, hour] = bestKey.split('-').map(Number);
      const total = entries.reduce((acc, [_, c]) => acc + (c as number), 0);
      const confidence = (bestCount as number) / total;

      if (confidence < 0.5) continue;

      const hasTimeTrigger = scene.triggers.some(
        t => t.type === SceneTriggerType.TIME || t.type === SceneTriggerType.CRON,
      );

      if (!hasTimeTrigger) {
        const optimizedTrigger = {
          id: uuidv4(),
          type: SceneTriggerType.TIME,
          config: { time: `${String(hour).padStart(2, '0')}:00` },
        };

        optimized.push({
          sceneId: scene.id,
          sceneName: scene.name,
          suggestion: `检测到您最常在周${dow} ${hour}:00使用此场景，建议添加定时触发`,
          confidence: (confidence * 100).toFixed(0) + '%',
          trigger: optimizedTrigger,
          usageCount: scene.executionCount,
        });
      }
    }

    return optimized;
  }

  private async generateSceneSuggestions(homeId: string, behaviors: UserBehaviorLogEntity[]) {
    const suggestions: any[] = [];

    const hourPatterns: Record<string, Map<string, number>> = {};
    for (const behavior of behaviors) {
      if (!behavior.deviceId) continue;
      const hour = new Date(behavior.createdAt).getHours();
      const key = `H${hour}`;
      if (!hourPatterns[key]) hourPatterns[key] = new Map();
      const devMap = hourPatterns[key];
      devMap.set(behavior.deviceId, (devMap.get(behavior.deviceId) || 0) + 1);
    }

    for (const [hourKey, devMap] of Object.entries(hourPatterns)) {
      const hour = parseInt(hourKey.slice(1));
      const frequentDevices = Array.from(devMap.entries())
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (frequentDevices.length >= 1) {
        const deviceInfos = await Promise.all(
          frequentDevices.map(async ([deviceId]) => {
            const dev = await this.deviceRepo.findOne({ where: { id: deviceId } });
            return dev ? { deviceId, name: dev.name, category: dev.category } : null;
          }),
        );
        const valid = deviceInfos.filter(Boolean);
        if (valid.length > 0) {
          suggestions.push({
            type: 'combo_scene',
            title: `${hour}:00 定时场景建议`,
            description: `检测到您常在${hour}:00操作以下设备：${valid.map(v => v!.name).join('、')}，建议创建组合场景`,
            devices: valid,
            trigger: { type: 'TIME', time: `${String(hour).padStart(2, '0')}:00` },
            confidence: Math.min(95, 50 + frequentDevices.length * 10),
          });
        }
      }
    }

    const acDevices = await this.deviceRepo.find({
      where: { homeId, category: DeviceCategory.AIR_CONDITIONER },
    });
    if (acDevices.length > 0) {
      suggestions.push({
        type: 'smart_scene',
        title: '智能温度调节建议',
        description: '根据室内温度传感器自动调节空调温度，既舒适又节能',
        devices: acDevices.map(d => ({ deviceId: d.id, name: d.name })),
        trigger: { type: 'SENSOR', sensorType: 'temperature' },
        confidence: '75%',
        autoApplyTemplate: {
          category: DeviceCategory.AIR_CONDITIONER,
          conditions: [{ field: 'temperature', operator: 'gt', value: 28 }],
          actions: [{ command: 'temperature', value: 24 }],
        },
      });
    }

    const lightDevices = await this.deviceRepo.find({
      where: { homeId, category: DeviceCategory.LIGHT },
    });
    if (lightDevices.length > 0) {
      suggestions.push({
        type: 'smart_scene',
        title: '夜间人体感应照明建议',
        description: '夜间检测到人体活动时自动开启走廊/卫生间灯，30秒后自动关闭',
        devices: lightDevices.slice(0, 2).map(d => ({ deviceId: d.id, name: d.name })),
        trigger: { type: 'SENSOR', sensorType: 'motion' },
        confidence: '80%',
      });
    }

    return suggestions.slice(0, 5);
  }

  async getSuggestions(homeId: string) {
    const cached = await this.cache.get<any>(`learning:${homeId}:suggestions`);
    if (cached) return cached;

    const fresh = await this.learnForHome(homeId);
    return { ...fresh, generatedAt: new Date() };
  }

  async applyOptimization(userId: string, sceneId: string, optimization: any) {
    const scene = await this.sceneRepo.findOne({ where: { id: sceneId } });
    if (!scene) throw new Error('场景不存在');

    const home = await this.homeRepo.findOne({ where: { id: scene.homeId } });
    if (!home || (home.ownerId !== userId && !home.members.some(m => m.userId === userId && m.role !== 'member'))) {
      throw new Error('无权限修改场景');
    }

    if (optimization.trigger) {
      scene.triggers.push(optimization.trigger);
    }
    if (optimization.condition) {
      scene.conditions.push({ ...optimization.condition, id: uuidv4() });
    }

    const saved = await this.sceneRepo.save(scene);
    await this.logOptimizationApplied(userId, sceneId, optimization);
    return saved;
  }

  async createSceneFromSuggestion(userId: string, homeId: string, suggestion: any) {
    const devices = await this.deviceRepo
      .createQueryBuilder('d')
      .where('d.id IN (:...ids)', { ids: suggestion.devices?.map((d: any) => d.deviceId) || [] })
      .andWhere('d.homeId = :homeId', { homeId })
      .getMany();

    if (!devices.length) throw new Error('设备不存在或不属于该家庭');

    const triggers: any[] = [];
    if (suggestion.trigger?.type === 'TIME') {
      triggers.push({ id: uuidv4(), type: SceneTriggerType.TIME, config: { time: suggestion.trigger.time } });
    } else if (suggestion.trigger?.type === 'SENSOR') {
      triggers.push({
        id: uuidv4(),
        type: SceneTriggerType.SENSOR,
        config: { sensorType: suggestion.trigger.sensorType },
      });
    }
    if (triggers.length === 0) {
      triggers.push({ id: uuidv4(), type: SceneTriggerType.MANUAL, config: {} });
    }

    const actions: any[] = devices.map((d, i) => ({
      id: uuidv4(),
      type: SceneActionType.DEVICE_CONTROL,
      order: i,
      config: {
        deviceId: d.id,
        commands: suggestion.autoApplyTemplate?.actions?.reduce(
          (acc: any, a: any) => ({ ...acc, [a.command]: a.value }), { power: true, onoff: true },
        ) || { power: true, onoff: true },
      },
    }));

    const conditions = suggestion.autoApplyTemplate?.conditions?.map((c: any) => ({
      ...c,
      id: uuidv4(),
    })) || [];

    const scene = this.sceneRepo.create({
      homeId,
      name: suggestion.title || `AI优化场景 ${new Date().toLocaleDateString()}`,
      description: suggestion.description || '由AI用户习惯学习功能自动生成',
      triggers,
      actions,
      conditions,
      status: SceneStatus.DISABLED,
      autoLearning: true,
      learningData: { usageCount: 0, optimalTriggerTimes: {}, lastWeekStats: [] },
    });
    const saved = await this.sceneRepo.save(scene);

    await this.logOptimizationApplied(userId, saved.id, { source: 'suggestion', suggestion });

    return {
      scene: saved,
      nextSteps: '场景已创建（默认禁用），请在场景编辑中完善配置并启用',
    };
  }

  async getHabitsReport(homeId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const behaviors = await this.behaviorRepo
      .createQueryBuilder('b')
      .where('b.homeId = :homeId', { homeId })
      .andWhere('b.createdAt >= :weekAgo', { weekAgo })
      .getMany();

    const hourDistribution = new Array(24).fill(0);
    const dayDistribution = new Array(7).fill(0);
    const actionCounts: Record<string, number> = {};

    for (const b of behaviors) {
      const date = new Date(b.createdAt);
      hourDistribution[date.getHours()]++;
      dayDistribution[date.getDay()]++;
      actionCounts[b.action] = (actionCounts[b.action] || 0) + 1;
    }

    const deviceIdCounts = behaviors
      .filter(b => b.deviceId)
      .reduce((acc: Record<string, number>, b) => {
        acc[b.deviceId!] = (acc[b.deviceId!] || 0) + 1;
        return acc;
      }, {});

    const popularDeviceIds = Object.entries(deviceIdCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const popularDevices = await this.deviceRepo
      .createQueryBuilder('d')
      .where('d.id IN (:...ids)', { ids: popularDeviceIds })
      .getMany();

    return {
      period: '最近7天',
      totalInteractions: behaviors.length,
      avgDaily: (behaviors.length / 7).toFixed(1),
      peakHour: hourDistribution.indexOf(Math.max(...hourDistribution)),
      peakDay: dayDistribution.indexOf(Math.max(...dayDistribution)),
      hourDistribution,
      dayDistribution,
      topActions: Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      mostUsedDevices: popularDevices.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        interactions: deviceIdCounts[d.id] || 0,
      })),
    };
  }

  private async logOptimizationApplied(userId: string, sceneId: string, optimization: any) {
    try {
      const log = this.behaviorRepo.create({
        userId,
        sceneId,
        action: 'learning_optimization_applied',
        context: { optimization },
      });
      await this.behaviorRepo.save(log);
    } catch (err) {
      this.logger.error('Failed to log optimization:', err);
    }
  }
}
