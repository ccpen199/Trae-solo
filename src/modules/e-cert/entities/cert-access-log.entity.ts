import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CertRecord } from './cert-record.entity';

export type CallerType = 'user' | 'system' | 'dept';

@Entity('ec_cert_access_log')
export class CertAccessLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '持证人用户ID' })
  @Index('idx_access_log_user_id')
  userId: string;

  @Column({
    name: 'caller_type',
    type: 'varchar',
    length: 20,
    comment: '调用方类型:user-用户 system-系统 dept-委办局',
  })
  @Index('idx_access_log_caller_type')
  callerType: CallerType;

  @Column({ name: 'caller_id', type: 'varchar', length: 100, comment: '调用方ID' })
  @Index('idx_access_log_caller_id')
  callerId: string;

  @Column({ name: 'caller_name', type: 'varchar', length: 200, nullable: true, comment: '调用方名称' })
  callerName: string | null;

  @Column({ name: 'cert_record_id', type: 'uuid', comment: '证照记录ID' })
  @Index('idx_access_log_cert_record_id')
  certRecordId: string;

  @Column({ name: 'cert_code', type: 'varchar', length: 50, nullable: true, comment: '证照编码' })
  certCode: string | null;

  @Column({ name: 'accessed_fields', type: 'json', comment: '访问的字段列表(JSON数组)' })
  accessedFields: string[];

  @Column({ name: 'purpose', type: 'varchar', length: 500, nullable: true, comment: '调用用途说明' })
  purpose: string | null;

  @Column({ name: 'item_code', type: 'varchar', length: 50, nullable: true, comment: '关联事项编码' })
  itemCode: string | null;

  @Column({ name: 'authorization_id', type: 'uuid', nullable: true, comment: '授权记录ID' })
  authorizationId: string | null;

  @Column({ name: 'ip', type: 'varchar', length: 45, comment: '调用方IP地址' })
  ip: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true, comment: 'User-Agent' })
  userAgent: string | null;

  @Column({
    name: 'access_result',
    type: 'varchar',
    length: 20,
    default: 'success',
    comment: '访问结果:success-成功 denied-拒绝 error-异常',
  })
  accessResult: string;

  @Column({ name: 'deny_reason', type: 'varchar', length: 500, nullable: true, comment: '拒绝原因' })
  denyReason: string | null;

  @Column({
    name: 'access_time',
    type: 'timestamp',
    comment: '访问时间',
  })
  @Index('idx_access_log_access_time')
  accessTime: Date;

  @Column({ name: 'retention_until', type: 'timestamp', comment: '日志留存截止日期(90天)' })
  retentionUntil: Date;

  @ManyToOne(() => CertRecord, (certRecord) => certRecord.accessLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cert_record_id' })
  certRecord: CertRecord;
}
