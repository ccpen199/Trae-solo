import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('sys_role_permission')
@Index('idx_role_id_perm', ['roleId'])
@Index('idx_permission_id', ['permissionId'])
@Index('idx_role_permission', ['roleId', 'permissionId'], { unique: true })
export class RolePermission extends BaseEntity {
  @Column({ name: 'role_id', type: 'uuid', comment: '角色ID' })
  roleId: string;

  @Column({ name: 'permission_id', type: 'uuid', comment: '权限ID' })
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
