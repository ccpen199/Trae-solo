import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module, ModuleType } from './entities/module.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModuleService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
  ) {}

  async create(createModuleDto: CreateModuleDto): Promise<Module> {
    const existing = await this.moduleRepository.findOne({
      where: { code: createModuleDto.code },
    });
    if (existing) {
      throw new ConflictException('模块编码已存在');
    }

    if (createModuleDto.parentId) {
      const parent = await this.moduleRepository.findOne({
        where: { id: createModuleDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('父模块不存在');
      }
    }

    const module = this.moduleRepository.create(createModuleDto);
    return this.moduleRepository.save(module);
  }

  async findAll(): Promise<Module[]> {
    return this.moduleRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: ['parent'],
    });
  }

  async findOne(id: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!module) {
      throw new NotFoundException('模块不存在');
    }
    return module;
  }

  async findByCode(code: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { code },
      relations: ['parent', 'children'],
    });
    if (!module) {
      throw new NotFoundException('模块不存在');
    }
    return module;
  }

  async getTree(enabledOnly: boolean = false): Promise<Module[]> {
    const query = this.moduleRepository.createQueryBuilder('module');
    
    if (enabledOnly) {
      query.where('module.enabled = true');
    }

    const allModules = await query
      .orderBy('module.sortOrder', 'ASC')
      .getMany();

    const buildTree = (parentId: string | null): Module[] => {
      return allModules
        .filter((m) => m.parentId === parentId)
        .map((m) => ({
          ...m,
          children: buildTree(m.id),
        } as Module));
    };

    return buildTree(null);
  }

  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    const module = await this.findOne(id);

    if (updateModuleDto.code && updateModuleDto.code !== module.code) {
      const existing = await this.moduleRepository.findOne({
        where: { code: updateModuleDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('模块编码已存在');
      }
    }

    if (updateModuleDto.parentId === id) {
      throw new ConflictException('不能将自己设为父模块');
    }

    if (updateModuleDto.parentId) {
      const childrenIds = await this.getChildrenIds(id);
      if (childrenIds.includes(updateModuleDto.parentId)) {
        throw new ConflictException('不能将子模块设为父模块');
      }
    }

    await this.moduleRepository.update(id, updateModuleDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const module = await this.findOne(id);

    const children = await this.moduleRepository.find({
      where: { parentId: id },
    });
    if (children.length > 0) {
      throw new ConflictException('该模块下有子模块，无法删除');
    }

    await this.moduleRepository.remove(module);
  }

  async getChildrenIds(parentId: string): Promise<string[]> {
    const modules = await this.moduleRepository
      .createQueryBuilder('module')
      .where('module.parent_id = :parentId', { parentId })
      .getMany();

    let ids = [parentId];
    for (const m of modules) {
      const childIds = await this.getChildrenIds(m.id);
      ids = [...ids, ...childIds];
    }
    return ids;
  }

  async initDefaultModules(): Promise<Module[]> {
    const defaultModules = [
      { code: 'SYSTEM', name: '系统管理', icon: 'setting', path: '/system', type: ModuleType.PARENT, sortOrder: 1 },
      { code: 'ORGANIZATION', name: '组织管理', icon: 'apartment', path: '/system/organization', type: ModuleType.CHILD, parentCode: 'SYSTEM', sortOrder: 1 },
      { code: 'STORE', name: '门店管理', icon: 'shop', path: '/system/store', type: ModuleType.CHILD, parentCode: 'SYSTEM', sortOrder: 2 },
      { code: 'USER', name: '人员管理', icon: 'team', path: '/system/user', type: ModuleType.CHILD, parentCode: 'SYSTEM', sortOrder: 3 },
      { code: 'ROLE', name: '角色管理', icon: 'safety-certificate', path: '/system/role', type: ModuleType.CHILD, parentCode: 'SYSTEM', sortOrder: 4 },
      { code: 'MODULE', name: '模块管理', icon: 'appstore', path: '/system/module', type: ModuleType.CHILD, parentCode: 'SYSTEM', sortOrder: 5 },
      { code: 'WORKFLOW', name: '工作流', icon: 'deployment-unit', path: '/workflow', type: ModuleType.PARENT, sortOrder: 2 },
      { code: 'WORKFLOW_CONFIG', name: '流程配置', icon: 'setting', path: '/workflow/config', type: ModuleType.CHILD, parentCode: 'WORKFLOW', sortOrder: 1 },
      { code: 'WORKFLOW_TASK', name: '我的任务', icon: 'inbox', path: '/workflow/task', type: ModuleType.CHILD, parentCode: 'WORKFLOW', sortOrder: 2 },
      { code: 'WORKFLOW_INITIATE', name: '发起流程', icon: 'plus-circle', path: '/workflow/initiate', type: ModuleType.CHILD, parentCode: 'WORKFLOW', sortOrder: 3 },
      { code: 'IM', name: '即时通讯', icon: 'message', path: '/im', type: ModuleType.PARENT, sortOrder: 3 },
      { code: 'IM_CHAT', name: '聊天', icon: 'message', path: '/im/chat', type: ModuleType.CHILD, parentCode: 'IM', sortOrder: 1 },
      { code: 'IM_GROUP', name: '群组管理', icon: 'team', path: '/im/group', type: ModuleType.CHILD, parentCode: 'IM', sortOrder: 2 },
      { code: 'IM_ARCHIVE', name: '消息归档', icon: 'file-search', path: '/im/archive', type: ModuleType.CHILD, parentCode: 'IM', sortOrder: 3 },
    ];

    const result: Module[] = [];
    const moduleMap = new Map<string, Module>();

    for (const moduleData of defaultModules) {
      let parentId: string | null = null;
      
      if (moduleData.parentCode) {
        const parent = moduleMap.get(moduleData.parentCode);
        if (parent) {
          parentId = parent.id;
        }
      }

      const existing = await this.moduleRepository.findOne({
        where: { code: moduleData.code },
      });

      if (existing) {
        result.push(existing);
        moduleMap.set(moduleData.code, existing);
      } else {
        const { parentCode, ...createData } = moduleData;
        const module = this.moduleRepository.create({
          ...createData,
          parentId,
        });
        const saved = await this.moduleRepository.save(module);
        result.push(saved);
        moduleMap.set(moduleData.code, saved);
      }
    }

    return result;
  }
}
