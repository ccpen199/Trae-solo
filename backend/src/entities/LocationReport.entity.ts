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
import { RiderEntity } from './Rider.entity';
import { OrderEntity } from './Order.entity';
import { Coordinate } from '@shared/types';

@Entity('location_reports')
@Index(['riderId', 'timestamp'])
@Index(['orderId', 'timestamp'])
export class LocationReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  riderId: string;

  @Column({ length: 36, nullable: true })
  orderId?: string;

  @Column({ type: 'jsonb' })
  location: Coordinate;

  @Column({ type: 'float', nullable: true })
  speed?: number;

  @Column({ type: 'float', nullable: true })
  heading?: number;

  @Column({ type: 'float', nullable: true })
  accuracy?: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ default: true })
  isOnline: boolean;

  @Column({ type: 'float', nullable: true })
  batteryLevel?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RiderEntity, (rider) => rider.locationReports)
  @JoinColumn({ name: 'riderId' })
  rider: RiderEntity;

  @ManyToOne(() => OrderEntity, (order) => order.locationReports)
  @JoinColumn({ name: 'orderId' })
  order?: OrderEntity;
}
