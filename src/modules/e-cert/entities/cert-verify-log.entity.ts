import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CertRecord } from './cert-record.entity';

export type VerifyMethod = 'hash' | 'gateway' | 'chain';
export type VerifyLevel = 'basic' | 'standard' | 'strict';

@Entity('ec_cert_verify_log')
export class CertVerifyLog extends BaseEntity {
  @Column({ name: 'verifier_id', type: 'uuid', comment: '验真方ID' })
  @Index('idx_verify_log_verifier_id')
  verifierId: string;

  @Column({ name: 'verifier_name', type: 'varchar', length: 200, nullable: true, comment: '验真方名称' })
  verifierName: string | null;

  @Column({ name: 'verifier_type', type: 'varchar', length: 20, default: 'dept', comment: '验真方类型:user/dept/system' })
  verifierType: string;

  @Column({ name: 'cert_record_id', type: 'uuid', comment: '证照记录ID' })
  @Index('idx_verify_log_cert_record_id')
  certRecordId: string;

  @Column({ name: 'cert_code', type: 'varchar', length: 50, nullable: true, comment: '证照编码' })
  certCode: string | null;

  @Column({ name: 'verify_fields', type: 'json', comment: '验真的字段列表(JSON数组)' })
  verifyFields: string[];

  @Column({
    name: 'verify_method',
    type: 'varchar',
    length: 20,
    default: 'hash',
    comment: '验真方式:hash-哈希比对 gateway-委办局实时验真 chain-区块链验真',
  })
  verifyMethod: VerifyMethod;

  @Column({
    name: 'verify_level',
    type: 'varchar',
    length: 20,
    default: 'standard',
    comment: '验真级别:basic-基础 standard-标准 strict-严格',
  })
  verifyLevel: VerifyLevel;

  @Column({
    name: 'verify_result',
    type: 'boolean',
    comment: '验真结果:true-通过 false-不通过',
  })
  verifyResult: boolean;

  @Column({ name: 'detail', type: 'json', nullable: true, comment: '验真详情(各字段的验真结果)' })
  detail: Record<string, unknown> | null;

  @Column({ name: 'gateway_response', type: 'text', nullable: true, comment: '委办局网关原始响应(加密存储)' })
  gatewayResponse: string | null;

  @Column({ name: 'report_id', type: 'varchar', length: 100, unique: true, nullable: true, comment: '验真报告编号' })
  reportId: string | null;

  @Column({
    name: 'verify_time',
    type: 'timestamp',
    comment: '验真时间',
  })
  @Index('idx_verify_log_verify_time')
  verifyTime: Date;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true, comment: '验真方IP' })
  ip: string | null;

  @Column({ name: 'purpose', type: 'varchar', length: 500, nullable: true, comment: '验真用途' })
  purpose: string | null;

  @Column({ name: 'item_code', type: 'varchar', length: 50, nullable: true, comment: '关联事项编码' })
  itemCode: string | null;

  @ManyToOne(() => CertRecord, (certRecord) => certRecord.verifyLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cert_record_id' })
  certRecord: CertRecord;
}
