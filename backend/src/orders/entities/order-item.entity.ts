import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { OrderItemStatus } from '../../common/types';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  menuItemId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'text', nullable: true })
  specifications: string;

  @Column({ type: 'text', nullable: true })
  customerRemarks: string;

  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  status: OrderItemStatus;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid', nullable: true })
  printId: string;

  @Column({ type: 'datetime', nullable: true })
  printedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  preparingAt: Date;

  @Column({ type: 'datetime', nullable: true })
  readyAt: Date;

  @Column({ type: 'datetime', nullable: true })
  servedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Order', 'items')
  order: any;

  @ManyToOne('MenuItem', 'orderItems')
  menuItem: any;
}
