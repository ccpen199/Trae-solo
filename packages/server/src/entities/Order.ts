import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Farmer } from './Farmer.js';
import { RetailStore } from './RetailStore.js';
import { CreditAccount } from './CreditAccount.js';
import { OrderItem } from './OrderItem.js';
import { CreditApplication } from './CreditApplication.js';
import { Dispute } from './Dispute.js';
import { OrderStatus } from '../types/common.js';

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT = 'credit',
  ONLINE = 'online',
  BANK_TRANSFER = 'bank_transfer',
}

export enum DeliveryMethod {
  STORE_PICKUP = 'store_pickup',
  HOME_DELIVERY = 'home_delivery',
  THIRD_PARTY = 'third_party',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    default: DeliveryMethod.STORE_PICKUP,
  })
  deliveryMethod: DeliveryMethod;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  subtotalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  deliveryAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  creditAmount: number;

  @Column({ type: 'text', nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLongitude: number | null;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  farmerId: string | null;

  @ManyToOne(() => Farmer, (farmer) => farmer.orders, { nullable: true })
  farmer: Farmer | null;

  @Column({ type: 'uuid', nullable: true })
  retailStoreId: string | null;

  @ManyToOne(() => RetailStore, (retailStore) => retailStore.orders, { nullable: true })
  retailStore: RetailStore | null;

  @Column({ type: 'uuid', nullable: true })
  creditAccountId: string | null;

  @ManyToOne(() => CreditAccount, (creditAccount) => creditAccount.orders, { nullable: true })
  creditAccount: CreditAccount | null;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => CreditApplication, (creditApplication) => creditApplication.order)
  creditApplications: CreditApplication[];

  @OneToMany(() => Dispute, (dispute) => dispute.order)
  disputes: Dispute[];

  calculateTotal(): void {
    this.totalAmount = 
      this.subtotalAmount + 
      this.taxAmount + 
      this.deliveryAmount - 
      this.discountAmount;
  }
}
