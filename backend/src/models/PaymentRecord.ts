import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { User } from './User';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
}

export enum PaymentChannel {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  UNIONPAY = 'unionpay',
  BALANCE = 'balance',
}

@Entity()
export class PaymentRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  transactionId: string;

  @ManyToOne(() => Order, order => order.payments)
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => User)
  payer: User;

  @Column()
  payerId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'simple-enum',
    enum: PaymentChannel,
  })
  channel: PaymentChannel;

  @Column({ nullable: true })
  channelTransactionId: string;

  @Column({ type: 'text', nullable: true })
  complianceReceipt: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;
}
