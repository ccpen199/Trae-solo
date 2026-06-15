import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type TicketSource = 'hotline_12345' | 'app' | 'website' | 'wechat' | 'onsite';
export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TicketStatus = 'pending' | 'dispatched' | 'processing' | 'transferred' | 'closed' | 'cancelled';

@Entity('gct_ticket')
export class Ticket extends BaseEntity {
  @Column({
    name: 'ticket_no',
    type: 'varchar',
    length: 32,
    unique: true,
    comment: '工单编号',
  })
  @Index('idx_ticket_no', { unique: true })
  ticketNo: string;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 255,
    comment: '工单标题',
  })
  title: string;

  @Column({
    name: 'content',
    type: 'text',
    comment: '工单内容',
  })
  content: string;

  @Column({
    name: 'contact_name',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '联系人姓名',
  })
  contactName: string | null;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '联系电话(SM4加密)',
  })
  contactPhone: string | null;

  @Column({
    name: 'category_id',
    type: 'uuid',
    nullable: true,
    comment: '工单分类ID',
  })
  categoryId: string | null;

  @Column({
    name: 'sub_category_id',
    type: 'uuid',
    nullable: true,
    comment: '工单子分类ID',
  })
  subCategoryId: string | null;

  @Column({
    name: 'dept_code',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '指派部门编码',
  })
  deptCode: string | null;

  @Column({
    name: 'source',
    type: 'varchar',
    length: 20,
    default: 'app',
    comment: '工单来源: hotline_12345-12345热线 app-APP website-官网 wechat-微信 onsite-现场',
  })
  source: TicketSource;

  @Column({
    name: 'priority',
    type: 'varchar',
    length: 10,
    default: 'normal',
    comment: '优先级: urgent-紧急 high-高 normal-普通 low-低',
  })
  priority: TicketPriority;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '状态: pending-待分派 dispatched-已分派 processing-处理中 transferred-已转办 closed-已办结 cancelled-已取消',
  })
  status: TicketStatus;

  @Column({
    name: 'submitter_id',
    type: 'uuid',
    nullable: true,
    comment: '提交人ID',
  })
  submitterId: string | null;

  @Column({
    name: 'create_time',
    type: 'timestamp',
    comment: '提交时间',
  })
  createTime: Date;

  @Column({
    name: 'expect_reply_time',
    type: 'timestamp',
    nullable: true,
    comment: '期望回复时间',
  })
  expectReplyTime: Date | null;

  @Column({
    name: 'dispatch_time',
    type: 'timestamp',
    nullable: true,
    comment: '分派时间',
  })
  dispatchTime: Date | null;

  @Column({
    name: 'close_time',
    type: 'timestamp',
    nullable: true,
    comment: '办结时间',
  })
  closeTime: Date | null;

  @Column({
    name: 'urgent_count',
    type: 'int',
    default: 0,
    comment: '催办次数',
  })
  urgentCount: number;

  @Column({
    name: 'external_ticket_no',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: '外部系统工单编号(12345等)',
  })
  externalTicketNo: string | null;
}
