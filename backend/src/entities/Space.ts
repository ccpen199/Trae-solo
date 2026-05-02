import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Flight } from './Flight';
import { MasterWaybill } from './MasterWaybill';

export enum SpaceStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  OCCUPIED = 'occupied',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

export enum SpaceType {
  GENERAL = 'general',
  DANGEROUS = 'dangerous',
  LIVE_ANIMAL = 'live_animal',
  PERISHABLE = 'perishable',
  VALUABLE = 'valuable',
  OVERSIZE = 'oversize',
}

@Entity('spaces')
export class Space extends BaseEntity {
  @Column({ name: 'space_no', type: 'varchar', unique: true })
  spaceNo!: string;

  @ManyToOne(() => Flight)
  @JoinColumn({ name: 'flight_id' })
  flight!: Flight;

  @Column({ name: 'flight_id', type: 'varchar' })
  flightId!: string;

  @Column({ name: 'flight_no', type: 'varchar' })
  flightNo!: string;

  @Column({ type: 'simple-enum', enum: SpaceType, default: SpaceType.GENERAL })
  type!: SpaceType;

  @Column({ name: 'type_display', type: 'varchar', nullable: true })
  typeDisplay?: string;

  @Column({ type: 'simple-enum', enum: SpaceStatus, default: SpaceStatus.AVAILABLE })
  status!: SpaceStatus;

  @Column({ name: 'status_display', type: 'varchar', nullable: true })
  statusDisplay?: string;

  @Column({ name: 'allocated_weight', type: 'decimal', precision: 10, scale: 2, default: 0 })
  allocatedWeight!: number;

  @Column({ name: 'allocated_volume', type: 'decimal', precision: 10, scale: 3, default: 0 })
  allocatedVolume!: number;

  @Column({ name: 'max_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeight?: number;

  @Column({ name: 'max_volume', type: 'decimal', precision: 10, scale: 3, nullable: true })
  maxVolume?: number;

  @Column({ name: 'unit_price_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPriceWeight?: number;

  @Column({ name: 'unit_price_volume', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPriceVolume?: number;

  @Column({ name: 'lock_expire_time', type: 'datetime', nullable: true })
  lockExpireTime?: Date;

  @Column({ name: 'locked_by', type: 'varchar', nullable: true })
  lockedBy?: string;

  @Column({ name: 'locked_at', type: 'datetime', nullable: true })
  lockedAt?: Date;

  @Column({ name: 'lock_reason', type: 'varchar', nullable: true })
  lockReason?: string;

  @Column({ name: 'master_waybill_id', type: 'varchar', nullable: true })
  masterWaybillId?: string;

  @Column({ name: 'master_no', type: 'varchar', nullable: true })
  masterNo?: string;

  @Column({ name: 'allocated_by', type: 'varchar', nullable: true })
  allocatedBy?: string;

  @Column({ name: 'allocated_at', type: 'datetime', nullable: true })
  allocatedAt?: Date;

  @Column({ name: 'released_at', type: 'datetime', nullable: true })
  releasedAt?: Date;

  @Column({ name: 'released_by', type: 'varchar', nullable: true })
  releasedBy?: string;

  @Column({ name: 'release_reason', type: 'text', nullable: true })
  releaseReason?: string;

  @Column({ name: 'valid_from', type: 'datetime', nullable: true })
  validFrom?: Date;

  @Column({ name: 'valid_to', type: 'datetime', nullable: true })
  validTo?: Date;

  @Column({ name: 'is_bookable', type: 'boolean', default: true })
  isBookable!: boolean;

  @Column({ name: 'priority', type: 'integer', default: 0 })
  priority!: number;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;
}
