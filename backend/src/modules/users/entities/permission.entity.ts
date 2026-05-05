import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PermissionModule, PermissionAction } from '../../../common/types';
import { Role } from './role.entity';

@Entity('permissions')
@Index(['module', 'action'], { unique: true, where: "is_deleted = false" })
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar' })
  module: PermissionModule;

  @Column({ type: 'varchar' })
  action: PermissionAction;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
