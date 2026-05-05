import { Entity, Column, ManyToMany, JoinTable, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RoleType } from '../../../common/types';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { SitePermission } from './site-permission.entity';
import { CategoryPermission } from './category-permission.entity';

@Entity('roles')
@Index(['code'], { unique: true, where: "is_deleted = false" })
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ 
    type: 'varchar', 
    default: RoleType.CUSTOM,
    name: 'role_type' 
  })
  roleType: RoleType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => SitePermission, sitePermission => sitePermission.role)
  sitePermissions: SitePermission[];

  @OneToMany(() => CategoryPermission, categoryPermission => categoryPermission.role)
  categoryPermissions: CategoryPermission[];

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_system' })
  isSystem: boolean;
}
