import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CertRecord } from './cert-record.entity';

export interface CertFieldDef {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  encrypted: boolean;
  masked: boolean;
  maskPattern?: string;
  required?: boolean;
  enumValues?: string[];
}

@Entity('ec_cert_catalog')
export class CertCatalog extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 50, unique: true, comment: '证照编码' })
  @Index('idx_cert_catalog_code', { unique: true })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 100, comment: '证照名称' })
  name: string;

  @Column({ name: 'category', type: 'varchar', length: 50, comment: '证照分类' })
  category: string;

  @Column({ name: 'dept_code', type: 'varchar', length: 20, comment: '发证部门编码' })
  deptCode: string;

  @Column({ name: 'dept_name', type: 'varchar', length: 100, nullable: true, comment: '发证部门名称' })
  deptName: string | null;

  @Column({ name: 'valid_period', type: 'int', default: 0, comment: '有效期(天), 0表示长期有效' })
  validPeriod: number;

  @Column({ name: 'cert_fields_def', type: 'json', comment: '证照字段定义列表(JSON)' })
  certFieldsDef: CertFieldDef[];

  @Column({ name: 'icon', type: 'varchar', length: 500, nullable: true, comment: '证照图标URL' })
  icon: string | null;

  @Column({ name: 'description', type: 'text', nullable: true, comment: '证照说明' })
  description: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'active',
    comment: '状态:active-启用 inactive-停用',
  })
  status: string;

  @OneToMany(() => CertRecord, (certRecord) => certRecord.certCatalog)
  certRecords: CertRecord[];
}
