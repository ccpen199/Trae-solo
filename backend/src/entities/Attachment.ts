import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { StatusFlow } from './StatusFlow';
import { Comment } from './Comment';

export enum AttachmentType {
  WAYBILL = 'waybill',
  INVOICE = 'invoice',
  PACKING_LIST = 'packing_list',
  CERTIFICATE = 'certificate',
  PERMIT = 'permit',
  PHOTO = 'photo',
  SIGNATURE = 'signature',
  OTHER = 'other',
}

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({ name: 'file_name', type: 'varchar' })
  fileName!: string;

  @Column({ name: 'original_name', type: 'varchar' })
  originalName!: string;

  @Column({ name: 'file_path', type: 'varchar' })
  filePath!: string;

  @Column({ name: 'file_size', type: 'integer' })
  fileSize!: number;

  @Column({ name: 'file_type', type: 'varchar', nullable: true })
  fileType?: string;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType?: string;

  @Column({ type: 'simple-enum', enum: AttachmentType, default: AttachmentType.OTHER })
  category!: AttachmentType;

  @Column({ name: 'category_display', type: 'varchar', nullable: true })
  categoryDisplay?: string;

  @ManyToOne(() => MasterWaybill, { nullable: true })
  @JoinColumn({ name: 'master_waybill_id' })
  masterWaybill?: MasterWaybill;

  @Column({ name: 'master_waybill_id', type: 'varchar', nullable: true })
  masterWaybillId?: string;

  @ManyToOne(() => StatusFlow, { nullable: true })
  @JoinColumn({ name: 'status_flow_id' })
  statusFlow?: StatusFlow;

  @Column({ name: 'status_flow_id', type: 'varchar', nullable: true })
  statusFlowId?: string;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment?: Comment;

  @Column({ name: 'comment_id', type: 'varchar', nullable: true })
  commentId?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'uploader_id', type: 'varchar' })
  uploaderId!: string;

  @Column({ name: 'uploader_name', type: 'varchar' })
  uploaderName!: string;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'storage_type', type: 'varchar', default: 'local' })
  storageType!: string;

  @Column({ name: 'checksum', type: 'varchar', nullable: true })
  checksum?: string;

  @Column({ name: 'version', type: 'integer', default: 1 })
  version!: number;

  @Column({ name: 'parent_attachment_id', type: 'varchar', nullable: true })
  parentAttachmentId?: string;
}
