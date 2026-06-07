import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { ServiceCategory } from './ServiceCategory';
import { OrderItem } from './OrderItem';

@Entity()
export class ServiceSKU {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ default: 0 })
  duration: number;

  @Column({ type: 'simple-json', nullable: true })
  includedItems: string[];

  @Column({ type: 'simple-json', nullable: true })
  excludedItems: string[];

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ServiceCategory, category => category.skus)
  category: ServiceCategory;

  @Column()
  categoryId: number;

  @OneToMany(() => OrderItem, item => item.serviceSku)
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
