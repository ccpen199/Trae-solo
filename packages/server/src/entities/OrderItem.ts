import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Order } from './Order.js';
import { Product } from './Product.js';
import { ProductBatch } from './ProductBatch.js';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'varchar', length: 100 })
  productSku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batchNumber: string | null;

  @Column({ type: 'text', nullable: true })
  specifications: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true })
  product: Product | null;

  @Column({ type: 'uuid', nullable: true })
  batchId: string | null;

  @ManyToOne(() => ProductBatch, { nullable: true })
  batch: ProductBatch | null;
}
