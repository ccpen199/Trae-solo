import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Manufacturer } from './Manufacturer.js';
import { ProductBatch } from './ProductBatch.js';
import { PricePolicy } from './PricePolicy.js';

export enum ProductCategory {
  FERTILIZER = 'fertilizer',
  PESTICIDE = 'pesticide',
  HERBICIDE = 'herbicide',
  SEED = 'seed',
  MACHINERY = 'machinery',
  FEED = 'feed',
  OTHER = 'other',
}

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DISCONTINUED = 'discontinued',
}

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHER,
  })
  category: ProductCategory;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  suggestedUnitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  costPrice: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  specifications: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  images: string[] | null;

  @Column({ type: 'integer', nullable: true })
  shelfLifeDays: number | null;

  @Column({ type: 'boolean', default: true })
  requiresBatchTracking: boolean;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid' })
  manufacturerId: string;

  @ManyToOne(() => Manufacturer, (manufacturer) => manufacturer.products)
  manufacturer: Manufacturer;

  @OneToMany(() => ProductBatch, (batch) => batch.product)
  batches: ProductBatch[];

  @OneToMany(() => PricePolicy, (pricePolicy) => pricePolicy.product)
  pricePolicies: PricePolicy[];
}
