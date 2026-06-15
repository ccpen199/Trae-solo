import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

export type ThirdPartyPlatform = 'nx_gov' | 'wechat' | 'alipay';

@Entity('sys_third_party_account')
@Index('idx_platform_openid', ['platform', 'openId'], { unique: true })
@Index('idx_user_id_third', ['userId'])
export class ThirdPartyAccount extends BaseEntity {
  @Column({
    name: 'platform',
    type: 'varchar',
    length: 20,
    comment: '平台:nx_gov-宁夏政务 wechat-微信 alipay-支付宝',
  })
  platform: ThirdPartyPlatform;

  @Column({ name: 'open_id', type: 'varchar', length: 100, comment: '第三方平台用户唯一标识' })
  openId: string;

  @Column({ name: 'union_id', type: 'varchar', length: 100, nullable: true, comment: '第三方平台联合ID' })
  unionId: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, comment: '关联用户ID' })
  userId: string | null;

  @Column({ name: 'access_token', type: 'text', nullable: true, comment: '第三方平台访问令牌' })
  accessToken: string | null;

  @Column({ name: 'refresh_token', type: 'text', nullable: true, comment: '第三方平台刷新令牌' })
  refreshToken: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true, comment: '令牌过期时间' })
  expiresAt: Date | null;

  @Column({ name: 'raw_user_info', type: 'jsonb', nullable: true, comment: '原始用户信息' })
  rawUserInfo: Record<string, unknown> | null;

  @ManyToOne(() => User, (user) => user.thirdPartyAccounts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
