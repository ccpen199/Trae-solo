import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CertCatalog } from './cert-catalog.entity';
import { CertField } from './cert-field.entity';
import { CertAccessLog } from './cert-access-log.entity';
import { CertVerifyLog } from './cert-verify-log.entity';

export type CertStatus = 'valid' | 'invalid' | 'expired' | 'revoked';

@Entity('ec_cert_record')
export class CertRecord extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '持证人用户ID' })
  @Index('idx_cert_record_user_id')
  userId: string;

  @Column({ name: 'cert_code', type: 'varchar', length: 50, comment: '证照编码' })
  @Index('idx_cert_record_cert_code')
  certCode: string;

  @Column({ name: 'cert_no', type: 'varchar', length: 500, comment: '证照编号(SM4加密)' })
  certNo: string;

  @Column({ name: 'cert_no_hash', type: 'varchar', length: 64, nullable: true, comment: '证照编号SHA256哈希(用于验真)' })
  certNoHash: string | null;

  @Column({ name: 'issue_dept', type: 'varchar', length: 100, comment: '发证机关' })
  issueDept: string;

  @Column({ name: 'issue_dept_code', type: 'varchar', length: 20, nullable: true, comment: '发证机关编码' })
  issueDeptCode: string | null;

  @Column({ name: 'issue_date', type: 'date', comment: '发证日期' })
  issueDate: Date;

  @Column({ name: 'expire_date', type: 'date', nullable: true, comment: '有效期截止日期' })
  expireDate: Date | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'valid',
    comment: '状态:valid-有效 invalid-无效 expired-过期 revoked-注销',
  })
  @Index('idx_cert_record_status')
  status: CertStatus;

  @Column({ name: 'cert_data', type: 'text', comment: '加密存储的证照全量字段JSON(SM4加密)' })
  certData: string;

  @Column({ name: 'cert_data_hash', type: 'varchar', length: 64, nullable: true, comment: '证照全量数据SHA256哈希' })
  certDataHash: string | null;

  @Column({ name: 'data_source', type: 'varchar', length: 50, default: 'gateway', comment: '数据来源:gateway-委办局网关 manual-手工录入' })
  dataSource: string;

  @Column({ name: 'sync_time', type: 'timestamp', nullable: true, comment: '最近同步时间' })
  syncTime: Date | null;

  @Column({ name: 'source_id', type: 'varchar', length: 100, nullable: true, comment: '委办局源系统记录ID' })
  sourceId: string | null;

  @ManyToOne(() => CertCatalog, (certCatalog) => certCatalog.certRecords)
  @JoinColumn({ name: 'cert_code', referencedColumnName: 'code' })
  certCatalog: CertCatalog;

  @OneToMany(() => CertField, (certField) => certField.certRecord)
  certFields: CertField[];

  @OneToMany(() => CertAccessLog, (accessLog) => accessLog.certRecord)
  accessLogs: CertAccessLog[];

  @OneToMany(() => CertVerifyLog, (verifyLog) => verifyLog.certRecord)
  verifyLogs: CertVerifyLog[];
}
