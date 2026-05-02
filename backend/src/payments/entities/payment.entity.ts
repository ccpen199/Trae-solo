import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../../common/types';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  paymentNumber: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ length: 100, nullable: true })
  transactionId: string;

  @Column({ length: 100, nullable: true })
  thirdPartyTransactionId: string;

  @Column({ type: 'simple-json', nullable: true })
  paymentDetails: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'uuid', nullable: true })
  operatorId: string;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;

  @Column({ type: 'datetime', nullable: true })
  refundedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Order', 'payments')
  order: any;

  @ManyToOne('User')
  operator: any;
}
