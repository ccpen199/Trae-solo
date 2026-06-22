import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderEntity } from './Order.entity.js';
import { Coordinate } from '@shared/types';

@Entity('order_trajectories')
export class OrderTrajectoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'jsonb' })
  points: {
    location: Coordinate;
    timestamp: Date;
    speed?: number;
  }[];

  @Column({ type: 'float', default: 0 })
  distance: number;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => OrderEntity, (order) => order.trajectories)
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;
}
