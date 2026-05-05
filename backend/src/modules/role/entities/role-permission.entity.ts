import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Module } from '../../module/entities/module.entity';

export enum PermissionType {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ALL = 'all',
}

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_id', comment: '角色ID' })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'module_id', comment: '模块ID' })
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.rolePermissions)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column({
    type: 'simple-array',
    comment: '权限类型: view, create, update, delete',
  })
  permissions: PermissionType[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
