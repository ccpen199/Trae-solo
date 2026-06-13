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
