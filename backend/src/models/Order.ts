import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';
import { OrderItem } from './OrderItem';
import { OrderLog } from './OrderLog';
import { Review } from './Review';
import { Dispute } from './Dispute';
import { PaymentRecord } from './PaymentRecord';

export enum OrderStatus {
  PENDING_DISPATCH = 'pending_dispatch',
  DISPATCHED = 'dispatched',
  ACCEPTED = 'accepted',
  SCHEDULED = 'scheduled',
  EN_ROUTE = 'en_route',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNo: string;

  @ManyToOne(() => User, user => user.customerOrders)
  customer: User;

  @Column()
  customerId: number;

  @ManyToOne(() => User, user => user.providerOrders, { nullable: true })
  provider: User;

  @Column({ nullable: true })
  providerId: number;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_DISPATCH,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'text', nullable: true })
  customerAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'datetime', nullable: true })
  scheduledTime: Date;

  @Column({ type: 'datetime', nullable: true })
  acceptedTime: Date;

  @Column({ type: 'datetime', nullable: true })
  arrivedTime: Date;

  @Column({ type: 'datetime', nullable: true })
  startedTime: Date;

  @Column({ type: 'datetime', nullable: true })
  completedTime: Date;

  @Column({ type: 'text', nullable: true })
  customerNotes: string;

  @Column({ type: 'text', nullable: true })
  providerNotes: string;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderLog, log => log.order, { cascade: true })
  logs: OrderLog[];

  @OneToMany(() => PaymentRecord, payment => payment.order)
  payments: PaymentRecord[];

  @OneToMany(() => Review, review => review.order)
  reviews: Review[];

  @OneToMany(() => Dispute, dispute => dispute.order)
  disputes: Dispute[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
