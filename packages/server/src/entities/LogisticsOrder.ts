import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Warehouse } from './Warehouse.js';
import { PickupRequest } from './PickupRequest.js';
import { LogisticsTemperature } from './LogisticsTemperature.js';
import { LogisticsStatus } from '../types/common.js';

@Entity('logistics_orders')
export class LogisticsOrder extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  trackingNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  carrier: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  driverName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  driverPhone: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleNumber: string | null;

  @Column({
    type: 'enum',
    enum: LogisticsStatus,
    default: LogisticsStatus.CREATED,
  })
  status: LogisticsStatus;

  @Column({ type: 'text', nullable: true })
  originAddress: string | null;

  @Column({ type: 'text', nullable: true })
  destinationAddress: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  originLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  originLongitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destinationLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destinationLongitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedDistanceKm: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedDurationHours: number | null;

  @Column({ type: 'timestamp', nullable: true })
  estimatedDeliveryTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualPickupTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryTime: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  checkpoints: Array<{
    timestamp: Date;
    location: string;
    latitude: number | null;
    longitude: number | null;
    status: string;
    notes: string | null;
  }> | null;

  @Column({ type: 'boolean', default: false })
  requiresTemperatureControl: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  targetTemperatureMin: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  targetTemperatureMax: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalWeight: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalVolume: number | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  freightCost: number | null;

  @Column({ type: 'text', nullable: true })
  specialInstructions: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  originWarehouseId: string | null;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.outgoingOrders, { nullable: true })
  originWarehouse: Warehouse | null;

  @Column({ type: 'uuid', nullable: true })
  destinationWarehouseId: string | null;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.incomingOrders, { nullable: true })
  destinationWarehouse: Warehouse | null;

  @Column({ type: 'uuid', nullable: true })
  pickupRequestId: string | null;

  @ManyToOne(() => PickupRequest, (pickupRequest) => pickupRequest.logisticsOrders, { nullable: true })
  pickupRequest: PickupRequest | null;

  @OneToMany(() => LogisticsTemperature, (temp) => temp.logisticsOrder)
  temperatureRecords: LogisticsTemperature[];
}
