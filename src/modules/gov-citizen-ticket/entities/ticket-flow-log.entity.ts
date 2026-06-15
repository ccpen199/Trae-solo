import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type OperatorType = 'user' | 'dept' | 'admin';

@Entity('gct_ticket_flow_log')
export class TicketFlowLog extends BaseEntity {
  @Column({
    name: 'ticket_id',
    type: 'uuid',
    comment: '工单ID',
  })
  @Index('idx_tfl_ticket_id')
  ticketId: string;

  @Column({
    name: 'operator_type',
    type: 'varchar',
    length: 10,
    comment: '操作人类型: user-用户 dept-部门人员 admin-管理员',
  })
  operatorType: OperatorType;

  @Column({
    name: 'operator_id',
    type: 'uuid',
    nullable: true,
    comment: '操作人ID',
  })
  operatorId: string | null;

  @Column({
    name: 'operator_name',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '操作人姓名',
  })
  operatorName: string | null;

  @Column({
    name: 'action',
    type: 'varchar',
    length: 30,
    comment: '操作动作: create/submit/dispatch/process/transfer/return/extend/close/cancel/urgent/reply',
  })
  action: string;

  @Column({
    name: 'from_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '流转前状态',
  })
  fromStatus: string | null;

  @Column({
    name: 'to_status',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '流转后状态',
  })
  toStatus: string | null;

  @Column({
    name: 'from_dept_code',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '转出部门编码',
  })
  fromDeptCode: string | null;

  @Column({
    name: 'to_dept_code',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '转入部门编码',
  })
  toDeptCode: string | null;

  @Column({
    name: 'remark',
    type: 'text',
    nullable: true,
    comment: '备注说明',
  })
  remark: string | null;

  @Column({
    name: 'create_time',
    type: 'timestamp',
    comment: '操作时间',
  })
  createTime: Date;
}
