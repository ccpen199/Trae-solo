import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { LogisticsOrder } from './LogisticsOrder.js';
import { ProductBatch } from './ProductBatch.js';

export enum TemperatureAlertType {
  NORMAL = 'normal',
  BELOW_MIN = 'below_min',
  ABOVE_MAX = 'above_max',
}

@Entity('logistics_temperatures')
@Index(['logisticsOrderId', 'recordedAt'], { unique: false })
@Index(['batchId', 'recordedAt'], { unique: false })
export class LogisticsTemperature extends BaseEntity {
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  temperature: number;

  @Column({ type: 'timestamp' })
  recordedAt: Date;

  @Column({
    type: 'enum',
    enum: TemperatureAlertType,
    default: TemperatureAlertType.NORMAL,
  })
  alertType: TemperatureAlertType;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  targetTemperatureMin: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  targetTemperatureMax: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deviceId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  logisticsOrderId: string | null;

  @ManyToOne(() => LogisticsOrder, (logisticsOrder) => logisticsOrder.temperatureRecords, { nullable: true })
  logisticsOrder: LogisticsOrder | null;

  @Column({ type: 'uuid', nullable: true })
  batchId: string | null;

  @ManyToOne(() => ProductBatch, (batch) => batch.temperatureRecords, { nullable: true })
  batch: ProductBatch | null;

  checkTemperatureRange(): TemperatureAlertType {
    if (this.targetTemperatureMin !== null && this.targetTemperatureMax !== null) {
      if (this.temperature < this.targetTemperatureMin) {
        return TemperatureAlertType.BELOW_MIN;
      }
      if (this.temperature > this.targetTemperatureMax) {
        return TemperatureAlertType.ABOVE_MAX;
      }
    }
    return TemperatureAlertType.NORMAL;
  }
}
