import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { OrderType, OrderStatus, OrderSource } from '../../common/types';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.DINE_IN,
  })
  orderType: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderSource,
    default: OrderSource.SCAN,
  })
  source: OrderSource;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  payableAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'int', default: 0 })
  guestCount: number;

  @Column({ type: 'text', nullable: true })
  customerRemarks: string;

  @Column({ type: 'text', nullable: true })
  internalRemarks: string;

  @Column({ type: 'uuid', nullable: true })
  tableId: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ type: 'uuid', nullable: true })
  memberId: string;

  @Column({ type: 'simple-json', nullable: true })
  customerInfo: {
    name: string;
    phone: string;
    address?: string;
  };

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  preparingAt: Date;

  @Column({ type: 'datetime', nullable: true })
  readyAt: Date;

  @Column({ type: 'datetime', nullable: true })
  servedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Table', 'orders')
  table: any;

  @ManyToOne('User', 'orders')
  createdByUser: any;

  @OneToMany('OrderItem', 'order', { cascade: true })
  items: any[];

  @OneToMany('OrderLog', 'order', { cascade: true })
  logs: any[];

  @OneToMany('Payment', 'order')
  payments: any[];
}
