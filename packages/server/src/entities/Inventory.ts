import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Warehouse } from './Warehouse.js';
import { Product } from './Product.js';
import { ProductBatch } from './ProductBatch.js';
import { InventoryStatus } from '../types/common.js';

@Entity('inventories')
@Index(['warehouseId', 'productId', 'batchId'], { unique: true })
export class Inventory extends BaseEntity {
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  reservedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  damagedQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  expiredQuantity: number;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.AVAILABLE,
  })
  status: InventoryStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  unitCost: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalValue: number | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastCountedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventories)
  warehouse: Warehouse;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: 'uuid', nullable: true })
  batchId: string | null;

  @ManyToOne(() => ProductBatch, (batch) => batch.inventories, { nullable: true })
  batch: ProductBatch | null;
}
