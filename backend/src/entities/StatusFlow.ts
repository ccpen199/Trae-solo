import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { WaybillDetail } from './WaybillDetail';

export enum FlowType {
  STATUS_CHANGE = 'status_change',
  ACTION = 'action',
  COMMENT = 'comment',
  APPROVAL = 'approval',
  REJECT = 'reject',
  CANCEL = 'cancel',
  EXCEPTION = 'exception',
  CORRECTION = 'correction',
  REOPEN = 'reopen',
}

export enum FlowNode {
  BOOKING = 'booking',
  RECEIVING = 'receiving',
  SECURITY = 'security',
  LOADING = 'loading',
  IN_TRANSIT = 'in_transit',
  ARRIVAL = 'arrival',
  PICKUP = 'pickup',
  COMPLETION = 'completion',
}

@Entity('status_flows')
export class StatusFlow extends BaseEntity {
  @ManyToOne(() => MasterWaybill, { nullable: true })
  @JoinColumn({ name: 'master_waybill_id' })
  masterWaybill?: MasterWaybill;

  @Column({ name: 'master_waybill_id', type: 'varchar', nullable: true })
  masterWaybillId?: string;

  @ManyToOne(() => WaybillDetail, { nullable: true })
  @JoinColumn({ name: 'waybill_detail_id' })
  waybillDetail?: WaybillDetail;

  @Column({ name: 'waybill_detail_id', type: 'varchar', nullable: true })
  waybillDetailId?: string;

  @Column({ type: 'simple-enum', enum: FlowType })
  flowType!: FlowType;

  @Column({ name: 'flow_type_display', type: 'varchar', nullable: true })
  flowTypeDisplay?: string;

  @Column({ name: 'flow_node', type: 'varchar', nullable: true })
  flowNode?: string;

  @Column({ name: 'flow_node_display', type: 'varchar', nullable: true })
  flowNodeDisplay?: string;

  @Column({ name: 'from_status', type: 'varchar', nullable: true })
  fromStatus?: string;

  @Column({ name: 'from_status_display', type: 'varchar', nullable: true })
  fromStatusDisplay?: string;

  @Column({ name: 'to_status', type: 'varchar' })
  toStatus!: string;

  @Column({ name: 'to_status_display', type: 'varchar', nullable: true })
  toStatusDisplay?: string;

  @Column({ name: 'action_type', type: 'varchar', nullable: true })
  actionType?: string;

  @Column({ name: 'action_display', type: 'varchar', nullable: true })
  actionDisplay?: string;

  @Column({ name: 'operator_id', type: 'varchar' })
  operatorId!: string;

  @Column({ name: 'operator_name', type: 'varchar' })
  operatorName!: string;

  @Column({ name: 'operator_role', type: 'varchar' })
  operatorRole!: string;

  @Column({ name: 'operator_role_display', type: 'varchar', nullable: true })
  operatorRoleDisplay?: string;

  @Column({ name: 'content', type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason?: string;

  @Column({ name: 'exception_type', type: 'varchar', nullable: true })
  exceptionType?: string;

  @Column({ name: 'exception_description', type: 'text', nullable: true })
  exceptionDescription?: string;

  @Column({ name: 'correction_type', type: 'varchar', nullable: true })
  correctionType?: string;

  @Column({ name: 'correction_reason', type: 'text', nullable: true })
  correctionReason?: string;

  @Column({ name: 'original_value', type: 'text', nullable: true })
  originalValue?: string;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string;

  @Column({ name: 'flow_time', type: 'datetime' })
  flowTime!: Date;

  @Column({ name: 'next_responsible_id', type: 'varchar', nullable: true })
  nextResponsibleId?: string;

  @Column({ name: 'next_responsible_role', type: 'varchar', nullable: true })
  nextResponsibleRole?: string;

  @Column({ name: 'next_node', type: 'varchar', nullable: true })
  nextNode?: string;

  @Column({ name: 'is_visible_on_timeline', type: 'boolean', default: true })
  isVisibleOnTimeline!: boolean;

  @Column({ name: 'timeline_icon', type: 'varchar', nullable: true })
  timelineIcon?: string;

  @Column({ name: 'timeline_color', type: 'varchar', nullable: true })
  timelineColor?: string;

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;
}
