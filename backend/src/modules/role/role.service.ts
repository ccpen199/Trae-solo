import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Module as ModuleEntity } from '../module/entities/module.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ModulePermissionDto } from './dto/assign-permissions.dto';
import { PermissionType } from './entities/role-permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(ModuleEntity)
    private moduleRepository: Repository<ModuleEntity>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { code: createRoleDto.code },
    });
    if (existing) {
      throw new ConflictException('角色编码已存在');
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['organization', 'rolePermissions', 'rolePermissions.module'],
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['organization', 'users', 'rolePermissions', 'rolePermissions.module'],
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async findByCode(code: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { code },
      relations: ['organization', 'rolePermissions', 'rolePermissions.module'],
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ConflictException('系统内置角色不能修改');
    }

    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      const existing = await this.roleRepository.findOne({
        where: { code: updateRoleDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('角色编码已存在');
      }
    }

    await this.roleRepository.update(id, updateRoleDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ConflictException('系统内置角色不能删除');
    }

    if (role.users?.length > 0) {
      throw new ConflictException('该角色下有用户，无法删除');
    }

    await this.rolePermissionRepository.delete({ roleId: id });
    await this.roleRepository.remove(role);
  }

  async assignPermissions(roleId: string, modulePermissions: ModulePermissionDto[]): Promise<Role> {
    const role = await this.findOne(roleId);

    if (role.isSystem) {
      throw new ConflictException('系统内置角色不能修改权限');
    }

    await this.rolePermissionRepository.delete({ roleId });

    for (const mp of modulePermissions) {
      const moduleEntity = await this.moduleRepository.findOne({
        where: { id: mp.moduleId },
      });
      if (!moduleEntity) {
        throw new NotFoundException(`模块 ${mp.moduleId} 不存在`);
      }

      const rolePermission = this.rolePermissionRepository.create({
        roleId,
        moduleId: mp.moduleId,
        permissions: mp.permissions,
      });
      await this.rolePermissionRepository.save(rolePermission);
    }

    return this.findOne(roleId);
  }

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['module'],
    });
  }

  async initDefaultRoles(): Promise<Role[]> {
    const defaultRoles = [
      { code: 'SUPER_ADMIN', name: '超级管理员', description: '系统最高权限角色', isSystem: true },
      { code: 'ORG_ADMIN', name: '组织管理员', description: '组织级管理员', isSystem: true },
      { code: 'STORE_ADMIN', name: '门店管理员', description: '门店级管理员', isSystem: true },
      { code: 'GENERAL_USER', name: '普通用户', description: '普通用户角色', isSystem: true },
    ];

    const result: Role[] = [];

    for (const roleData of defaultRoles) {
      const existing = await this.roleRepository.findOne({
        where: { code: roleData.code },
      });

      if (existing) {
        result.push(existing);
      } else {
        const role = this.roleRepository.create(roleData);
        const saved = await this.roleRepository.save(role);
        result.push(saved);
      }
    }

    return result;
  }
}
