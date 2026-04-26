import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Region } from './Region.js';
import { Inventory } from './Inventory.js';
import { LogisticsOrder } from './LogisticsOrder.js';

export enum WarehouseType {
  CENTRAL = 'central',
  REGIONAL = 'regional',
  TRANSIT = 'transit',
}

export enum WarehouseStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: WarehouseType,
    default: WarehouseType.REGIONAL,
  })
  type: WarehouseType;

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

  @Column({ type: 'integer', default: 10000 })
  maxCapacityUnits: number;

  @Column({ type: 'integer', default: 0 })
  usedCapacityUnits: number;

  @Column({
    type: 'enum',
    enum: WarehouseStatus,
    default: WarehouseStatus.ACTIVE,
  })
  status: WarehouseStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  regionId: string | null;

  @ManyToOne(() => Region, (region) => region.warehouses, { nullable: true })
  region: Region | null;

  @OneToMany(() => Inventory, (inventory) => inventory.warehouse)
  inventories: Inventory[];

  @OneToMany(() => LogisticsOrder, (logisticsOrder) => logisticsOrder.originWarehouse)
  outgoingOrders: LogisticsOrder[];

  @OneToMany(() => LogisticsOrder, (logisticsOrder) => logisticsOrder.destinationWarehouse)
  incomingOrders: LogisticsOrder[];
}
