import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Order } from './Order.js';
import { Farmer } from './Farmer.js';
import { TraceabilityRecord } from './TraceabilityRecord.js';
import { ExpertAssignment } from './ExpertAssignment.js';
import { DisputeStatus } from '../types/common.js';

export enum DisputeCategory {
  PRODUCT_QUALITY = 'product_quality',
  PEST_DAMAGE = 'pest_damage',
  INEFFECTIVE = 'ineffective',
  SIDE_EFFECT = 'side_effect',
  WRONG_PRODUCT = 'wrong_product',
  PRICE_DISPUTE = 'price_dispute',
  LOGISTICS_ISSUE = 'logistics_issue',
  OTHER = 'other',
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('disputes')
export class Dispute extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  disputeNumber: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: DisputeCategory,
    default: DisputeCategory.OTHER,
  })
  category: DisputeCategory;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @Column({
    type: 'enum',
    enum: DisputePriority,
    default: DisputePriority.MEDIUM,
  })
  priority: DisputePriority;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  claimedAmount: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  resolvedAmount: number | null;

  @Column({ type: 'jsonb', nullable: true })
  evidenceFiles: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    uploadedAt: Date;
    notes: string | null;
  }> | null;

  @Column({ type: 'text', nullable: true })
  expertReport: string | null;

  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  traceabilitySummary: {
    productionBatch: string;
    productionDate: string;
    qualityReport: string | null;
    logisticsHistory: Array<{
      checkpoint: string;
      timestamp: string;
      temperature: number | null;
      location: string;
    }>;
    warehouseHistory: Array<{
      warehouse: string;
      inDate: string;
      outDate: string | null;
      quantity: number;
    }>;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, (order) => order.disputes, { nullable: true })
  order: Order | null;

  @Column({ type: 'uuid', nullable: true })
  farmerId: string | null;

  @ManyToOne(() => Farmer, { nullable: true })
  farmer: Farmer | null;

  @OneToMany(() => TraceabilityRecord, (record) => record.dispute)
  traceabilityRecords: TraceabilityRecord[];

  @OneToMany(() => ExpertAssignment, (assignment) => assignment.dispute)
  expertAssignments: ExpertAssignment[];
}
