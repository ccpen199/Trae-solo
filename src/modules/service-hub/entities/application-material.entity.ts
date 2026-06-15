import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Application } from './application.entity';

export type MaterialStatus = 'pending' | 'uploaded' | 'cert_filled' | 'verified' | 'rejected';

@Entity('sh_application_material')
export class ApplicationMaterial extends BaseEntity {
  @Column({ name: 'application_id', type: 'uuid', comment: '申报单ID' })
  @Index('idx_mat_application_id')
  applicationId: string;

  @Column({ name: 'material_name', type: 'varchar', length: 200, comment: '材料名称' })
  materialName: string;

  @Column({ name: 'material_code', type: 'varchar', length: 50, nullable: true, comment: '材料编码' })
  materialCode: string | null;

  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true, comment: '文件URL' })
  fileUrl: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 200, nullable: true, comment: '文件名' })
  fileName: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true, comment: '文件大小(字节)' })
  fileSize: string | null;

  @Column({ name: 'cert_type', type: 'varchar', length: 50, nullable: true, comment: '电子证照类型编码' })
  certType: string | null;

  @Column({ name: 'cert_no', type: 'varchar', length: 100, nullable: true, comment: '电子证照编号' })
  certNo: string | null;

  @Column({ name: 'cert_data', type: 'jsonb', nullable: true, comment: '电子证照数据(JSON)' })
  certData: Record<string, unknown> | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '状态:pending-待上传 uploaded-已上传 cert_filled-证照预填 verified-已校验 rejected-校验不通过',
  })
  status: MaterialStatus;

  @Column({ name: 'required', type: 'boolean', default: true, comment: '是否必传' })
  required: boolean;

  @Column({ name: 'sort', type: 'int', default: 0, comment: '排序号' })
  sort: number;

  @Column({ name: 'remark', type: 'text', nullable: true, comment: '备注' })
  remark: string | null;

  @ManyToOne(() => Application, (application) => application.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}
