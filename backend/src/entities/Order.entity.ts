import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RiderEntity } from './Rider.entity';
import { TaskPoolEntity } from './TaskPool.entity';
import { LocationReportEntity } from './LocationReport.entity';
import { OrderTrajectoryEntity } from './OrderTrajectory.entity';
import { TimeoutWarningEntity } from './TimeoutWarning.entity';
import { ComplaintEntity } from './Complaint.entity';
import { OfflineSyncRecordEntity } from './OfflineSyncRecord.entity';
import { Coordinate, OrderType, OrderStatus } from '@shared/types';

@Entity('orders')
@Index(['orderNo'], { unique: true })
@Index(['status', 'createdAt'])
@Index(['riderId', 'status'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 32, unique: true })
  orderNo: string;

  @Column({
    type: 'enum',
    enum: ['delivery', 'pickup', 'errands', 'shopping'],
    default: 'delivery',
  })
  type: OrderType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tip?: number;

  @Column({ type: 'float' })
  distance: number;

  @Column({ type: 'int' })
  estimatedTime: number;

  @Column({ length: 500 })
  pickupAddress: string;

  @Column({ type: 'jsonb' })
  pickupLocation: Coordinate;

  @Column({ length: 50, nullable: true })
  pickupName?: string;

  @Column({ length: 20, nullable: true })
  pickupPhone?: string;

  @Column({ length: 500 })
  deliveryAddress: string;

  @Column({ type: 'jsonb' })
  deliveryLocation: Coordinate;

  @Column({ length: 50 })
  deliveryName: string;

  @Column({ length: 20 })
  deliveryPhone: string;

  @Column({ type: 'float', nullable: true })
  weight?: number;

  @Column({ length: 50, nullable: true })
  size?: string;

  @Column({ type: 'text', nullable: true })
  goodsDesc?: string;

  @Column({ type: 'timestamp', nullable: true })
  expectedPickupTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualPickupTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'picking_up', 'delivering', 'completed', 'cancelled', 'exception'],
    default: 'pending',
  })
  status: OrderStatus;

  @Column({ length: 36, nullable: true })
  riderId?: string;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string;

  @Column({ type: 'text', nullable: true })
  exceptionReason?: string;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ default: false })
  requireSignature: boolean;

  @Column({ type: 'jsonb', nullable: true })
  photos?: string[];

  @Column({
    type: 'enum',
    enum: ['system', 'api', 'manual'],
    default: 'system',
  })
  source: 'system' | 'api' | 'manual';

  @Column({ length: 100, nullable: true })
  externalOrderNo?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RiderEntity, (rider) => rider.orders)
  @JoinColumn({ name: 'riderId' })
  rider?: RiderEntity;

  @OneToMany(() => TaskPoolEntity, (task) => task.order)
  tasks: TaskPoolEntity[];

  @OneToMany(() => LocationReportEntity, (report) => report.order)
  locationReports: LocationReportEntity[];

  @OneToMany(() => OrderTrajectoryEntity, (trajectory) => trajectory.order)
  trajectories: OrderTrajectoryEntity[];

  @OneToMany(() => TimeoutWarningEntity, (warning) => warning.order)
  timeoutWarnings: TimeoutWarningEntity[];

  @OneToMany(() => ComplaintEntity, (complaint) => complaint.order)
  complaints: ComplaintEntity[];

  @OneToMany(() => OfflineSyncRecordEntity, (sync) => sync.data)
  offlineSyncRecords: OfflineSyncRecordEntity[];
}
