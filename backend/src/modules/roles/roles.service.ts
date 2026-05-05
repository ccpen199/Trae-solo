import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { RoleType } from '../../common/types';
import { Permission } from '../users/entities/permission.entity';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsEnum(RoleType)
  @IsOptional()
  roleType?: RoleType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(RoleType)
  @IsOptional()
  roleType?: RoleType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { code: createRoleDto.code, isDeleted: false },
    });
    if (existing) {
      throw new BadRequestException('角色代码已存在');
    }

    let permissions: Permission[] = [];
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      permissions = await this.permissionRepository.find({
        where: { id: In(createRoleDto.permissionIds), isDeleted: false },
      });
    }

    const role = this.roleRepository.create({
      ...createRoleDto,
      permissions,
      roleType: createRoleDto.roleType || RoleType.CUSTOM,
    });

    return this.roleRepository.save(role);
  }

  async findAll(includeInactive = false): Promise<Role[]> {
    const query = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('role.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('role.sortOrder', 'ASC')
      .addOrderBy('role.createdAt', 'DESC');

    if (!includeInactive) {
      query.andWhere('role.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不能修改');
    }

    if (updateRoleDto.permissionIds !== undefined) {
      if (updateRoleDto.permissionIds && updateRoleDto.permissionIds.length > 0) {
        role.permissions = await this.permissionRepository.find({
          where: { id: In(updateRoleDto.permissionIds), isDeleted: false },
        });
      } else {
        role.permissions = [];
      }
    }

    Object.assign(role, updateRoleDto);

    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    
    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不能删除');
    }

    role.isDeleted = true;
    await this.roleRepository.save(role);
  }
}
