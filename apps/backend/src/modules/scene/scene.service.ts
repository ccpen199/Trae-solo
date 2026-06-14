import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SceneEntity } from '../../database/entities/scene.entity';
import { SceneStatus, SceneTriggerType, SceneConditionOperator, SceneActionType } from '@iot/shared';
import { SceneEngineService } from './scene-engine.service';

@Injectable()
export class SceneService {
  private readonly logger = new Logger(SceneService.name);

  constructor(
    @InjectRepository(SceneEntity) private readonly sceneRepo: Repository<SceneEntity>,
    private readonly engine: SceneEngineService,
  ) {}

  async create(dto: {
    name: string;
    homeId: string;
    description?: string;
    coverImage?: string;
    triggers: any[];
    conditions?: any[];
    actions: any[];
  }) {
    this.validateScene(dto);

    const scene = this.sceneRepo.create({
      ...dto,
      triggers: dto.triggers.map(t => ({ ...t, id: uuidv4() })),
      conditions: (dto.conditions || []).map(c => ({ ...c, id: uuidv4() })),
      actions: dto.actions.map((a, i) => ({ ...a, id: uuidv4(), order: a.order ?? i })),
      status: SceneStatus.ENABLED,
      executionCount: 0,
    });

    const saved = await this.sceneRepo.save(scene);

    if (saved.status === SceneStatus.ENABLED) {
      this.engine.registerScene(saved);
    }

    return saved;
  }

  async findAll(homeId: string, status?: SceneStatus) {
    await this.ensureDefaultScenes(homeId);
    const where: any = { homeId };
    if (status) where.status = status;
    return this.sceneRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const scene = await this.sceneRepo.findOne({ where: { id } });
    if (!scene) throw new NotFoundException('场景不存在');
    return scene;
  }

  async update(id: string, dto: Partial<SceneEntity>) {
    const scene = await this.findOne(id);

    if (dto.triggers) {
      dto.triggers = dto.triggers.map(t => ({ ...t, id: t.id || uuidv4() }));
    }
    if (dto.conditions) {
      dto.conditions = dto.conditions.map(c => ({ ...c, id: c.id || uuidv4() }));
    }
    if (dto.actions) {
      dto.actions = dto.actions.map((a, i) => ({ ...a, id: a.id || uuidv4(), order: a.order ?? i }));
    }

    Object.assign(scene, dto);
    const saved = await this.sceneRepo.save(scene);

    this.engine.unregisterScene(id);
    if (saved.status === SceneStatus.ENABLED) {
      this.engine.registerScene(saved);
    }

    return saved;
  }

  async delete(id: string) {
    await this.sceneRepo.delete(id);
    this.engine.unregisterScene(id);
    return { success: true };
  }

  async toggleScene(id: string, status: SceneStatus) {
    const scene = await this.findOne(id);
    scene.status = status;
    const saved = await this.sceneRepo.save(scene);

    if (status === SceneStatus.ENABLED) {
      this.engine.registerScene(saved);
    } else {
      this.engine.unregisterScene(id);
    }

    return saved;
  }

  async executeScene(id: string, userId?: string) {
    const scene = await this.findOne(id);
    if (scene.status !== SceneStatus.ENABLED) {
      throw new BadRequestException('场景未启用');
    }
    return this.engine.executeScene(scene, userId);
  }

  async duplicateScene(id: string, newName?: string) {
    const scene = await this.findOne(id);
    const { id: _, createdAt: _c, executionCount: _ec, lastExecutedAt: _le, ...rest } = scene;
    return this.create({
      ...rest,
      name: newName || `${scene.name} (副本)`,
    });
  }

  private async ensureDefaultScenes(homeId: string) {
    if (!homeId) return;

    const existing = await this.sceneRepo.count({ where: { homeId } });
    if (existing > 0) return;

    const now = Date.now();
    const defaults = [
      {
        name: '回家模式',
        description: '进门后推送欢迎提醒，作为家庭自动化手动场景',
        triggers: [{ id: uuidv4(), type: SceneTriggerType.MANUAL, config: {} }],
        actions: [{
          id: uuidv4(),
          type: SceneActionType.NOTIFICATION,
          order: 0,
          config: { title: '回家模式已启动', content: '灯光、空调和窗帘联动准备完成。' },
        }],
        executionCount: 12,
        lastExecutedAt: new Date(now - 1000 * 60 * 35),
      },
      {
        name: '晚安巡检',
        description: '每天 22:30 检查设备状态并发送夜间提醒',
        triggers: [{ id: uuidv4(), type: SceneTriggerType.TIME, config: { time: '22:30' } }],
        actions: [{
          id: uuidv4(),
          type: SceneActionType.NOTIFICATION,
          order: 0,
          config: { title: '晚安巡检', content: '门锁、灯光和空调状态已纳入夜间巡检。' },
        }],
        executionCount: 28,
        lastExecutedAt: new Date(now - 1000 * 60 * 60 * 7),
      },
      {
        name: '能耗异常提醒',
        description: '当设备能耗异常时通知管理员复核',
        triggers: [{ id: uuidv4(), type: SceneTriggerType.SENSOR, config: { metric: 'power', operator: 'gt', threshold: 1200 } }],
        conditions: [{ id: uuidv4(), field: 'power', operator: SceneConditionOperator.GT, value: 1200 }],
        actions: [{
          id: uuidv4(),
          type: SceneActionType.NOTIFICATION,
          order: 0,
          config: { title: '能耗异常', content: '检测到设备能耗超过阈值，请及时处理。' },
        }],
        executionCount: 6,
        lastExecutedAt: new Date(now - 1000 * 60 * 60 * 24),
      },
    ];

    for (const item of defaults) {
      const saved = await this.sceneRepo.save(this.sceneRepo.create({
        ...item,
        homeId,
        conditions: item.conditions || [],
        status: SceneStatus.ENABLED,
      }));
      this.engine.registerScene(saved);
    }
  }

  private validateScene(dto: any) {
    if (!dto.triggers?.length) {
      throw new BadRequestException('场景至少需要一个触发器');
    }
    if (!dto.actions?.length) {
      throw new BadRequestException('场景至少需要一个动作');
    }
    for (const action of dto.actions) {
      if (action.type === SceneActionType.DEVICE_CONTROL && !action.config?.deviceId) {
        throw new BadRequestException('设备控制动作必须指定设备ID');
      }
      if (action.type === SceneActionType.DEVICE_CONTROL && !action.config?.commands) {
        throw new BadRequestException('设备控制动作必须指定控制命令');
      }
    }
  }
}
