import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('gct_dept_response')
export class DeptResponse extends BaseEntity {
  @Column({
    name: 'ticket_id',
    type: 'uuid',
    comment: '工单ID',
  })
  @Index('idx_dr_ticket_id')
  ticketId: string;

  @Column({
    name: 'dept_code',
    type: 'varchar',
    length: 50,
    comment: '部门编码',
  })
  deptCode: string;

  @Column({
    name: 'dept_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '部门名称',
  })
  deptName: string | null;

  @Column({
    name: 'handler_id',
    type: 'uuid',
    nullable: true,
    comment: '经办人ID',
  })
  handlerId: string | null;

  @Column({
    name: 'handler_name',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '经办人姓名',
  })
  handlerName: string | null;

  @Column({
    name: 'response_content',
    type: 'text',
    comment: '回复内容',
  })
  responseContent: string;

  @Column({
    name: 'attachments',
    type: 'json',
    nullable: true,
    comment: '回复附件(JSON数组)',
  })
  attachments: Array<Record<string, any>> | null;

  @Column({
    name: 'response_time',
    type: 'timestamp',
    comment: '回复时间',
  })
  responseTime: Date;

  @Column({
    name: 'is_final',
    type: 'boolean',
    default: false,
    comment: '是否为最终回复',
  })
  isFinal: boolean;
}
