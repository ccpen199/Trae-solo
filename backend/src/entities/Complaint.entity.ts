import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RiderEntity } from './Rider.entity.js';
import { OrderEntity } from './Order.entity.js';

@Entity('complaints')
@Index(['orderId', 'status'])
@Index(['reporterId', 'reporterType'])
export class ComplaintEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  reporterId: string;

  @Column({
    type: 'enum',
    enum: ['customer', 'rider', 'system'],
    default: 'customer',
  })
  reporterType: 'customer' | 'rider' | 'system';

  @Column({
    type: 'enum',
    enum: ['late_delivery', 'damaged', 'lost', 'rude', 'other'],
  })
  type: 'late_delivery' | 'damaged' | 'lost' | 'rude' | 'other';

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  photos?: string[];

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'resolved', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'processing' | 'resolved' | 'rejected';

  @Column({ type: 'varchar', length: 36, nullable: true })
  handlerId?: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  penaltyAmount?: number;

  @Column({ type: 'int', nullable: true })
  creditChange?: number;

  @Column({ type: 'timestamp', nullable: true })
  appealDeadline?: Date;

  @Column({ default: false })
  appealed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RiderEntity, (rider) => rider.complaints)
  @JoinColumn({ name: 'reporterId' })
  reporter: RiderEntity;

  @ManyToOne(() => OrderEntity, (order) => order.complaints)
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;
}
