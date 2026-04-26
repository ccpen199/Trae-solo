import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { CreditAccount } from './CreditAccount.js';
import { Farmer } from './Farmer.js';
import { Order } from './Order.js';

export enum CreditRecordType {
  PURCHASE = 'purchase',
  REPAYMENT = 'repayment',
  ADJUSTMENT = 'adjustment',
  INTEREST = 'interest',
  PENALTY = 'penalty',
  WRITE_OFF = 'write_off',
}

export enum CreditRecordStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('credit_records')
@Index(['creditAccountId', 'createdAt'], { unique: false })
@Index(['farmerId', 'createdAt'], { unique: false })
export class CreditRecord extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  recordNumber: string;

  @Column({
    type: 'enum',
    enum: CreditRecordType,
  })
  type: CreditRecordType;

  @Column({
    type: 'enum',
    enum: CreditRecordStatus,
    default: CreditRecordStatus.PENDING,
  })
  status: CreditRecordStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  previousBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  newBalance: number;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'date', nullable: true })
  paymentDate: string | null;

  @Column({ type: 'integer', default: 0 })
  daysOverdue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interestCharged: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  penaltyCharged: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  creditAccountId: string | null;

  @ManyToOne(() => CreditAccount, (creditAccount) => creditAccount.creditRecords, { nullable: true })
  creditAccount: CreditAccount | null;

  @Column({ type: 'uuid', nullable: true })
  farmerId: string | null;

  @ManyToOne(() => Farmer, (farmer) => farmer.creditRecords, { nullable: true })
  farmer: Farmer | null;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { nullable: true })
  order: Order | null;
}
