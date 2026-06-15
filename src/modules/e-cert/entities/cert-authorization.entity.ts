import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CertCatalog } from './cert-catalog.entity';

export type AuthorizationStatus = 'active' | 'expired' | 'revoked';
export type AuthorizationScope = 'all' | 'readonly' | 'specific_fields';

@Entity('ec_cert_authorization')
export class CertAuthorization extends BaseEntity {
  @Column({ name: 'grantor_id', type: 'uuid', comment: '授权人ID(持证人)' })
  @Index('idx_authz_grantor_id')
  grantorId: string;

  @Column({ name: 'grantee_dept_code', type: 'varchar', length: 20, comment: '被授权委办局编码' })
  @Index('idx_authz_grantee_dept')
  granteeDeptCode: string;

  @Column({ name: 'grantee_dept_name', type: 'varchar', length: 200, nullable: true, comment: '被授权委办局名称' })
  granteeDeptName: string | null;

  @Column({ name: 'grantee_user_id', type: 'uuid', nullable: true, comment: '被授权具体用户ID(可选)' })
  granteeUserId: string | null;

  @Column({ name: 'cert_code', type: 'varchar', length: 50, comment: '证照编码;*表示所有证照' })
  certCode: string;

  @Column({
    name: 'scope',
    type: 'varchar',
    length: 20,
    default: 'readonly',
    comment: '授权范围:all-全部 readonly-只读 specific_fields-指定字段',
  })
  scope: AuthorizationScope;

  @Column({ name: 'allowed_fields', type: 'json', nullable: true, comment: '允许访问的字段列表(当scope=specific_fields时)' })
  allowedFields: string[] | null;

  @Column({ name: 'item_code', type: 'varchar', length: 50, nullable: true, comment: '关联事项编码' })
  itemCode: string | null;

  @Column({ name: 'item_name', type: 'varchar', length: 200, nullable: true, comment: '关联事项名称' })
  itemName: string | null;

  @Column({ name: 'valid_from', type: 'timestamp', comment: '授权生效时间' })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamp', comment: '授权失效时间' })
  validTo: Date;

  @Column({ name: 'authorization_token', type: 'varchar', length: 500, unique: true, comment: '授权令牌(JWT格式)' })
  @Index('idx_authz_token', { unique: true })
  authorizationToken: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'active',
    comment: '状态:active-有效 expired-过期 revoked-已撤销',
  })
  @Index('idx_authz_status')
  status: AuthorizationStatus;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true, comment: '撤销时间' })
  revokedAt: Date | null;

  @Column({ name: 'revoked_reason', type: 'varchar', length: 500, nullable: true, comment: '撤销原因' })
  revokedReason: string | null;

  @Column({ name: 'times_used', type: 'int', default: 0, comment: '已使用次数' })
  timesUsed: number;

  @Column({ name: 'max_uses', type: 'int', nullable: true, comment: '最大使用次数(null表示不限)' })
  maxUses: number | null;

  @ManyToOne(() => CertCatalog)
  @JoinColumn({ name: 'cert_code', referencedColumnName: 'code' })
  certCatalog: CertCatalog;
}
