import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RolePermission } from './role-permission.entity';

@Entity('sys_permission')
export class Permission extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 100, unique: true, comment: '权限编码' })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 50, comment: '权限名称' })
  name: string;

  @Column({ name: 'module', type: 'varchar', length: 50, comment: '所属模块' })
  module: string;

  @Column({ name: 'action', type: 'varchar', length: 50, comment: '操作类型(create/read/update/delete等)' })
  action: string;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true, comment: '权限描述' })
  description: string | null;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];
}
