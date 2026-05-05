import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { RolePermission } from './role-permission.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '角色编码' })
  code: string;

  @Column({ comment: '角色名称' })
  name: string;

  @Column({ nullable: true, comment: '角色描述' })
  description: string;

  @Column({ name: 'organization_id', nullable: true, comment: '所属组织ID' })
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  rolePermissions: RolePermission[];

  @Column({ name: 'is_system', default: false, comment: '是否系统内置角色' })
  isSystem: boolean;

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
