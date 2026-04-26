import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Product } from './Product.js';
import { TraceabilityRecord } from './TraceabilityRecord.js';
import { Inventory } from './Inventory.js';
import { LogisticsTemperature } from './LogisticsTemperature.js';

export enum BatchStatus {
  PRODUCING = 'producing',
  QUALITY_CHECKING = 'quality_checking',
  QUALITY_PASSED = 'quality_passed',
  QUALITY_FAILED = 'quality_failed',
  IN_WAREHOUSE = 'in_warehouse',
  IN_TRANSIT = 'in_transit',
  SOLD = 'sold',
  EXPIRED = 'expired',
  RECALLED = 'recalled',
}

@Entity('product_batches')
@Index(['productId', 'batchNumber'], { unique: true })
export class ProductBatch extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  batchNumber: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableQuantity: number;

  @Column({ type: 'date', nullable: true })
  productionDate: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  qualityReportNumber: string | null;

  @Column({ type: 'text', nullable: true })
  qualityNotes: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatureRequiredMin: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatureRequiredMax: number | null;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.PRODUCING,
  })
  status: BatchStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.batches)
  product: Product;

  @OneToMany(() => TraceabilityRecord, (record) => record.batch)
  traceabilityRecords: TraceabilityRecord[];

  @OneToMany(() => Inventory, (inventory) => inventory.batch)
  inventories: Inventory[];

  @OneToMany(() => LogisticsTemperature, (temp) => temp.batch)
  temperatureRecords: LogisticsTemperature[];
}
