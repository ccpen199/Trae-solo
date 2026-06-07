import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { ServiceSKU } from './ServiceSKU';
import { ProductSKU } from './ProductSKU';

export enum ItemType {
  SERVICE = 'service',
  PRODUCT = 'product',
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.items)
  order: Order;

  @Column()
  orderId: number;

  @Column({
    type: 'simple-enum',
    enum: ItemType,
  })
  type: ItemType;

  @ManyToOne(() => ServiceSKU, { nullable: true })
  serviceSku: ServiceSKU;

  @Column({ nullable: true })
  serviceSkuId: number;

  @ManyToOne(() => ProductSKU, { nullable: true })
  productSku: ProductSKU;

  @Column({ nullable: true })
  productSkuId: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  createdAt: Date;
}
