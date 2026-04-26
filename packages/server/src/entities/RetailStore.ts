import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Region } from './Region.js';
import { User } from './User.js';
import { CreditAccount } from './CreditAccount.js';
import { PickupRequest } from './PickupRequest.js';
import { Order } from './Order.js';

export enum RetailStoreStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('retail_stores')
@Index(['regionId', 'status'], { unique: false })
export class RetailStore extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPerson: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  businessLicenseNumber: string | null;

  @Column({
    type: 'enum',
    enum: RetailStoreStatus,
    default: RetailStoreStatus.PENDING_VERIFICATION,
  })
  status: RetailStoreStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  regionId: string | null;

  @ManyToOne(() => Region, (region) => region.retailStores, { nullable: true })
  region: Region | null;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  @ManyToOne(() => User, (user) => user.ownedRetailStores, { nullable: true })
  owner: User | null;

  @OneToMany(() => CreditAccount, (creditAccount) => creditAccount.retailStore)
  creditAccounts: CreditAccount[];

  @OneToMany(() => PickupRequest, (pickupRequest) => pickupRequest.retailStore)
  pickupRequests: PickupRequest[];

  @OneToMany(() => Order, (order) => order.retailStore)
  orders: Order[];
}
