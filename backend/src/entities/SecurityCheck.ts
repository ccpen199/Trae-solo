import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { WaybillDetail } from './WaybillDetail';
import { User } from './User';

export enum SecurityCheckResult {
  PENDING = 'pending',
  PASSED = 'passed',
  REJECTED = 'rejected',
  NEED_SUPPLEMENT = 'need_supplement',
  REASSIGNED = 'reassigned',
}

export enum SecurityCheckLevel {
  LEVEL_1 = 'level_1',
  LEVEL_2 = 'level_2',
  LEVEL_3 = 'level_3',
  SPECIAL = 'special',
}

@Entity('security_checks')
export class SecurityCheck extends BaseEntity {
  @Column({ name: 'check_no', type: 'varchar', unique: true })
  checkNo!: string;

  @ManyToOne(() => MasterWaybill)
  @JoinColumn({ name: 'master_waybill_id' })
  masterWaybill!: MasterWaybill;

  @Column({ name: 'master_waybill_id', type: 'varchar' })
  masterWaybillId!: string;

  @ManyToOne(() => WaybillDetail, { nullable: true })
  @JoinColumn({ name: 'waybill_detail_id' })
  waybillDetail?: WaybillDetail;

  @Column({ name: 'waybill_detail_id', type: 'varchar', nullable: true })
  waybillDetailId?: string;

  @Column({ type: 'simple-enum', enum: SecurityCheckLevel, default: SecurityCheckLevel.LEVEL_1 })
  checkLevel!: SecurityCheckLevel;

  @Column({ name: 'check_level_display', type: 'varchar', nullable: true })
  checkLevelDisplay?: string;

  @Column({ type: 'simple-enum', enum: SecurityCheckResult, default: SecurityCheckResult.PENDING })
  result!: SecurityCheckResult;

  @Column({ name: 'result_display', type: 'varchar', nullable: true })
  resultDisplay?: string;

  @Column({ name: 'check_start_time', type: 'datetime', nullable: true })
  checkStartTime?: Date;

  @Column({ name: 'check_end_time', type: 'datetime', nullable: true })
  checkEndTime?: Date;

  @Column({ name: 'check_duration_seconds', type: 'integer', nullable: true })
  checkDurationSeconds?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checker_id' })
  checker!: User;

  @Column({ name: 'checker_id', type: 'varchar' })
  checkerId!: string;

  @Column({ name: 'checker_name', type: 'varchar' })
  checkerName!: string;

  @Column({ name: 'checker_role', type: 'varchar', default: 'security' })
  checkerRole!: string;

  @Column({ name: 'check_location', type: 'varchar', nullable: true })
  checkLocation?: string;

  @Column({ name: 'check_method', type: 'varchar', nullable: true })
  checkMethod?: string;

  @Column({ name: 'xray_image_url', type: 'varchar', nullable: true })
  xrayImageUrl?: string;

  @Column({ name: 'physical_check_performed', type: 'boolean', default: false })
  physicalCheckPerformed!: boolean;

  @Column({ name: 'physical_check_reason', type: 'text', nullable: true })
  physicalCheckReason?: string;

  @Column({ name: 'findings', type: 'text', nullable: true })
  findings?: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason?: string;

  @Column({ name: 'reject_category', type: 'varchar', nullable: true })
  rejectCategory?: string;

  @Column({ name: 'supplement_requirements', type: 'text', nullable: true })
  supplementRequirements?: string;

  @Column({ name: 'reassigned_to_id', type: 'varchar', nullable: true })
  reassignedToId?: string;

  @Column({ name: 'reassigned_to_name', type: 'varchar', nullable: true })
  reassignedToName?: string;

  @Column({ name: 'reassignment_reason', type: 'text', nullable: true })
  reassignmentReason?: string;

  @Column({ name: 'is_dangerous_goods', type: 'boolean', default: false })
  isDangerousGoods!: boolean;

  @Column({ name: 'dangerous_goods_class', type: 'varchar', nullable: true })
  dangerousGoodsClass?: string;

  @Column({ name: 'dangerous_goods_un_no', type: 'varchar', nullable: true })
  dangerousGoodsUnNo?: string;

  @Column({ name: 'dangerous_goods_description', type: 'text', nullable: true })
  dangerousGoodsDescription?: string;

  @Column({ name: 'requires_special_handling', type: 'boolean', default: false })
  requiresSpecialHandling!: boolean;

  @Column({ name: 'special_handling_instructions', type: 'text', nullable: true })
  specialHandlingInstructions?: string;

  @Column({ name: 'parent_check_id', type: 'varchar', nullable: true })
  parentCheckId?: string;

  @Column({ name: 'is_recheck', type: 'boolean', default: false })
  isRecheck!: boolean;

  @Column({ name: 'recheck_reason', type: 'text', nullable: true })
  recheckReason?: string;

  @Column({ name: 'recheck_count', type: 'integer', default: 0 })
  recheckCount!: number;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;
}
