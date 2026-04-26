import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { User } from './User.js';
import { CreditRecord } from './CreditRecord.js';
import { Order } from './Order.js';
import { Region } from './Region.js';

export enum FarmerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BLACKLISTED = 'blacklisted',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('farmers')
export class Farmer extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  idCardNumber: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalLandArea: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  landLocation: string | null;

  @Column({ type: 'jsonb', nullable: true })
  cropTypes: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  historicalYields: Array<{
    year: number;
    crop: string;
    yieldAmount: number;
    yieldUnit: string;
  }> | null;

  @Column({
    type: 'enum',
    enum: FarmerStatus,
    default: FarmerStatus.PENDING_VERIFICATION,
  })
  status: FarmerStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 60 })
  creditScore: number;

  @Column({ type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'integer', default: 0 })
  onTimePayments: number;

  @Column({ type: 'integer', default: 0 })
  latePayments: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  regionId: string | null;

  @ManyToOne(() => Region, { nullable: true })
  region: Region | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.farmerProfiles, { nullable: true })
  user: User | null;

  @OneToMany(() => CreditRecord, (creditRecord) => creditRecord.farmer)
  creditRecords: CreditRecord[];

  @OneToMany(() => Order, (order) => order.farmer)
  orders: Order[];
}
