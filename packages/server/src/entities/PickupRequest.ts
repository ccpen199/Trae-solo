import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { RetailStore } from './RetailStore.js';
import { Warehouse } from './Warehouse.js';
import { LogisticsOrder } from './LogisticsOrder.js';
import { PickupRequestStatus } from '../types/common.js';

@Entity('pickup_requests')
export class PickupRequest extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  requestNumber: string;

  @Column({
    type: 'enum',
    enum: PickupRequestStatus,
    default: PickupRequestStatus.PENDING,
  })
  status: PickupRequestStatus;

  @Column({ type: 'jsonb' })
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    batchId: string | null;
    batchNumber: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'boolean', default: false })
  useCredit: boolean;

  @Column({ type: 'text', nullable: true })
  creditCheckNotes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  creditCheckedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  creditCheckedBy: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryDate: Date | null;

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPerson: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid' })
  retailStoreId: string;

  @ManyToOne(() => RetailStore, (retailStore) => retailStore.pickupRequests)
  retailStore: RetailStore;

  @Column({ type: 'uuid', nullable: true })
  assignedWarehouseId: string | null;

  @ManyToOne(() => Warehouse, { nullable: true })
  assignedWarehouse: Warehouse | null;

  @OneToMany(() => LogisticsOrder, (logisticsOrder) => logisticsOrder.pickupRequest)
  logisticsOrders: LogisticsOrder[];
}
