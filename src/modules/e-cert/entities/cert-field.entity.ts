import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CertRecord } from './cert-record.entity';

@Entity('ec_cert_field')
export class CertField extends BaseEntity {
  @Column({ name: 'cert_record_id', type: 'uuid', comment: '证照记录ID' })
  @Index('idx_cert_field_record_id')
  certRecordId: string;

  @Column({ name: 'field_name', type: 'varchar', length: 100, comment: '字段名称' })
  @Index('idx_cert_field_name')
  fieldName: string;

  @Column({ name: 'field_value_sm4', type: 'text', comment: '字段值(SM4加密)' })
  fieldValueSm4: string;

  @Column({ name: 'field_value_hash', type: 'varchar', length: 64, comment: '字段值SHA256哈希(用于验真)' })
  fieldValueHash: string;

  @Column({ name: 'field_type', type: 'varchar', length: 20, default: 'string', comment: '字段类型:string/number/date/boolean' })
  fieldType: string;

  @ManyToOne(() => CertRecord, (certRecord) => certRecord.certFields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cert_record_id' })
  certRecord: CertRecord;
}
