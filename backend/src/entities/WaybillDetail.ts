import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { User } from './User';

export enum DetailStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  SECURITY_PASSED = 'security_passed',
  SECURITY_REJECTED = 'security_rejected',
  LOADED = 'loaded',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
}

@Entity('waybill_details')
export class WaybillDetail extends BaseEntity {
  @Column({ name: 'detail_no', type: 'varchar', unique: true })
  detailNo!: string;

  @ManyToOne(() => MasterWaybill)
  @JoinColumn({ name: 'master_waybill_id' })
  masterWaybill!: MasterWaybill;

  @Column({ name: 'master_waybill_id', type: 'varchar' })
  masterWaybillId!: string;

  @Column({ name: 'line_no', type: 'integer' })
  lineNo!: number;

  @Column({ name: 'goods_name', type: 'varchar' })
  goodsName!: string;

  @Column({ name: 'goods_code', type: 'varchar', nullable: true })
  goodsCode?: string;

  @Column({ name: 'goods_type', type: 'varchar', nullable: true })
  goodsType?: string;

  @Column({ name: 'pieces', type: 'integer' })
  pieces!: number;

  @Column({ name: 'unit', type: 'varchar', default: '件' })
  unit!: string;

  @Column({ name: 'weight', type: 'decimal', precision: 10, scale: 2 })
  weight!: number;

  @Column({ name: 'volume', type: 'decimal', precision: 10, scale: 3, nullable: true })
  volume?: number;

  @Column({ name: 'length', type: 'decimal', precision: 10, scale: 2, nullable: true })
  length?: number;

  @Column({ name: 'width', type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number;

  @Column({ name: 'height', type: 'decimal', precision: 10, scale: 2, nullable: true })
  height?: number;

  @Column({ name: 'chargeable_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  chargeableWeight?: number;

  @Column({ type: 'simple-enum', enum: DetailStatus, default: DetailStatus.PENDING })
  status!: DetailStatus;

  @Column({ name: 'status_display', type: 'varchar', nullable: true })
  statusDisplay?: string;

  @Column({ name: 'is_dangerous', type: 'boolean', default: false })
  isDangerous!: boolean;

  @Column({ name: 'dangerous_class', type: 'varchar', nullable: true })
  dangerousClass?: string;

  @Column({ name: 'un_number', type: 'varchar', nullable: true })
  unNumber?: string;

  @Column({ name: 'packing_type', type: 'varchar', nullable: true })
  packingType?: string;

  @Column({ name: 'mark_no', type: 'varchar', nullable: true })
  markNo?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'security_check_result', type: 'varchar', nullable: true })
  securityCheckResult?: string;

  @Column({ name: 'security_check_date', type: 'datetime', nullable: true })
  securityCheckDate?: Date;

  @Column({ name: 'security_checker_id', type: 'varchar', nullable: true })
  securityCheckerId?: string;

  @Column({ name: 'security_reject_reason', type: 'text', nullable: true })
  securityRejectReason?: string;

  @Column({ name: 'received_date', type: 'datetime', nullable: true })
  receivedDate?: Date;

  @Column({ name: 'received_by', type: 'varchar', nullable: true })
  receivedBy?: string;

  @Column({ name: 'loaded_date', type: 'datetime', nullable: true })
  loadedDate?: Date;

  @Column({ name: 'loaded_by', type: 'varchar', nullable: true })
  loadedBy?: string;

  @Column({ name: 'arrived_date', type: 'datetime', nullable: true })
  arrivedDate?: Date;

  @Column({ name: 'delivered_date', type: 'datetime', nullable: true })
  deliveredDate?: Date;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
