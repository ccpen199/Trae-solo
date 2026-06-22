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
import { OrderEntity } from './Order.entity';
import { DispatchMode, TaskPoolStatus, OrderType } from '@shared/types';

@Entity('task_pool')
@Index(['status', 'priority', 'expireTime'])
@Index(['orderId', 'status'])
export class TaskPoolEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  orderId: string;

  @Column({
    type: 'enum',
    enum: ['delivery', 'pickup', 'errands', 'shopping'],
    default: 'delivery',
  })
  orderType: OrderType;

  @Column({
    type: 'enum',
    enum: ['available', 'dispatched', 'accepted', 'expired'],
    default: 'available',
  })
  status: TaskPoolStatus;

  @Column({
    type: 'enum',
    enum: ['auto', 'manual', 'hybrid'],
    default: 'hybrid',
  })
  dispatchMode: DispatchMode;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ length: 36, nullable: true })
  assignedRiderId?: string;

  @Column({ type: 'timestamp', nullable: true })
  dispatchTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptTime?: Date;

  @Column({ type: 'timestamp' })
  expireTime: Date;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetryCount: number;

  @Column({ type: 'jsonb', default: [] })
  matchedRiders: string[];

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ default: false })
  isHot: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => OrderEntity, (order) => order.tasks)
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;
}
