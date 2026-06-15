import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('sys_user_role')
@Index('idx_user_id', ['userId'])
@Index('idx_role_id', ['roleId'])
@Index('idx_user_role', ['userId', 'roleId'], { unique: true })
export class UserRole extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '用户ID' })
  userId: string;

  @Column({ name: 'role_id', type: 'uuid', comment: '角色ID' })
  roleId: string;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
