import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from './user-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity('sys_role')
export class Role extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 50, unique: true, comment: '角色编码' })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 50, comment: '角色名称' })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true, comment: '角色描述' })
  description: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false, comment: '是否系统内置角色' })
  isSystem: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
