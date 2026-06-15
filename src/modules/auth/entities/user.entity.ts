import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from './user-role.entity';
import { ThirdPartyAccount } from './third-party-account.entity';

export type UserType = 'natural' | 'legal' | 'admin';

export type UserStatus = 'active' | 'inactive' | 'locked';

@Entity('sys_user')
export class User extends BaseEntity {
  @Column({ name: 'username', type: 'varchar', length: 50, unique: true, comment: '用户名' })
  @Index('idx_username', { unique: true })
  username: string;

  @Column({ name: 'real_name', type: 'varchar', length: 100, nullable: true, comment: '真实姓名' })
  realName: string | null;

  @Column({ name: 'id_card', type: 'varchar', length: 255, nullable: true, comment: '身份证号(SM4加密)' })
  idCard: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 255, nullable: true, comment: '手机号(SM4加密)' })
  phone: string | null;

  @Column({ name: 'email', type: 'varchar', length: 100, nullable: true, comment: '邮箱' })
  email: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true, comment: '密码哈希(bcrypt)' })
  passwordHash: string | null;

  @Column({ name: 'avatar', type: 'varchar', length: 500, nullable: true, comment: '头像URL' })
  avatar: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'active',
    comment: '状态:active-激活 inactive-未激活 locked-锁定',
  })
  status: UserStatus;

  @Column({
    name: 'user_type',
    type: 'varchar',
    length: 20,
    default: 'natural',
    comment: '用户类型:natural-自然人 legal-法人 admin-管理员',
  })
  userType: UserType;

  @Column({ name: 'last_login_ip', type: 'varchar', length: 45, nullable: true, comment: '最后登录IP' })
  lastLoginIp: string | null;

  @Column({ name: 'last_login_time', type: 'timestamp', nullable: true, comment: '最后登录时间' })
  lastLoginTime: Date | null;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => ThirdPartyAccount, (thirdPartyAccount) => thirdPartyAccount.user)
  thirdPartyAccounts: ThirdPartyAccount[];
}
