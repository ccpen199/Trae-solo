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
import { OrderEntity } from './Order.entity.js';

@Entity('timeout_warnings')
@Index(['orderId', 'warningType'])
@Index(['isAcknowledged', 'createdAt'])
export class TimeoutWarningEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  riderId: string;

  @Column({
    type: 'enum',
    enum: ['pickup_timeout', 'delivery_timeout', 'idle_timeout'],
  })
  warningType: 'pickup_timeout' | 'delivery_timeout' | 'idle_timeout';

  @Column({ type: 'int' })
  thresholdMinutes: number;

  @Column({ type: 'int' })
  remainingMinutes: number;

  @Column({ default: false })
  isAcknowledged: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => OrderEntity, (order) => order.timeoutWarnings)
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;
}
