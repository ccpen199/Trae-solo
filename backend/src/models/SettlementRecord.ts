import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { Order } from './Order';

export enum SettlementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  HELD = 'held',
}

@Entity()
export class SettlementRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  settlementNo: string;

  @ManyToOne(() => User)
  provider: User;

  @Column()
  providerId: number;

  @ManyToOne(() => Order)
  order: Order;

  @Column()
  orderId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  orderAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  settlementAmount: number;

  @Column({
    type: 'simple-enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ type: 'int', default: 7 })
  settlementDays: number;

  @Column({ type: 'datetime', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'datetime', nullable: true })
  settledDate: Date;

  @Column({ type: 'text', nullable: true })
  bankAccount: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
