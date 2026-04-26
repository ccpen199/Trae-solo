import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { CreditAccount } from './CreditAccount.js';
import { Order } from './Order.js';
import { CreditApplicationStatus } from '../types/common.js';

export enum CreditApplicationType {
  ORDER_PURCHASE = 'order_purchase',
  CREDIT_LIMIT_INCREASE = 'credit_limit_increase',
  TERM_EXTENSION = 'term_extension',
}

@Entity('credit_applications')
export class CreditApplication extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  applicationNumber: string;

  @Column({
    type: 'enum',
    enum: CreditApplicationType,
    default: CreditApplicationType.ORDER_PURCHASE,
  })
  applicationType: CreditApplicationType;

  @Column({
    type: 'enum',
    enum: CreditApplicationStatus,
    default: CreditApplicationStatus.PENDING,
  })
  status: CreditApplicationStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  requestedAmount: number;

  @Column({ type: 'integer', nullable: true })
  requestedTermDays: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  approvedAmount: number | null;

  @Column({ type: 'integer', nullable: true })
  approvedTermDays: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  creditScoreAtTime: number | null;

  @Column({ type: 'jsonb', nullable: true })
  creditEvaluation: {
    score: number;
    factors: Array<{
      factor: string;
      weight: number;
      score: number;
      notes: string;
    }>;
    overallRisk: 'low' | 'medium' | 'high';
    recommendation: string;
  } | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  creditAccountId: string | null;

  @ManyToOne(() => CreditAccount, (creditAccount) => creditAccount.creditApplications, { nullable: true })
  creditAccount: CreditAccount | null;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, (order) => order.creditApplications, { nullable: true })
  order: Order | null;
}
