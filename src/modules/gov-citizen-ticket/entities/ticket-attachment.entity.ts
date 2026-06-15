import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('gct_ticket_attachment')
export class TicketAttachment extends BaseEntity {
  @Column({
    name: 'ticket_id',
    type: 'uuid',
    comment: '工单ID',
  })
  @Index('idx_ta_ticket_id')
  ticketId: string;

  @Column({
    name: 'file_name',
    type: 'varchar',
    length: 255,
    comment: '文件名',
  })
  fileName: string;

  @Column({
    name: 'file_url',
    type: 'varchar',
    length: 500,
    comment: '文件URL',
  })
  fileUrl: string;

  @Column({
    name: 'file_size',
    type: 'bigint',
    nullable: true,
    comment: '文件大小(字节)',
  })
  fileSize: number | null;

  @Column({
    name: 'file_type',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '文件类型',
  })
  fileType: string | null;

  @Column({
    name: 'uploader_id',
    type: 'uuid',
    nullable: true,
    comment: '上传人ID',
  })
  uploaderId: string | null;

  @Column({
    name: 'upload_time',
    type: 'timestamp',
    comment: '上传时间',
  })
  uploadTime: Date;
}
