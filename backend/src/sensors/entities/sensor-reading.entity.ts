import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sensor } from './sensor.entity';

export enum DataQuality {
  RAW = 'raw',
  FILTERED = 'filtered',
  VALIDATED = 'validated',
  ANOMALY = 'anomaly',
}

@Entity('sensor_readings')
@Index(['sensorId', 'timestamp'])
@Index(['timestamp'])
export class SensorReading extends BaseEntity {
  @Column({ type: 'float', name: 'raw_value' })
  rawValue: number;

  @Column({ type: 'float', name: 'filtered_value', nullable: true })
  filteredValue: number;

  @Column({ type: 'datetime', name: 'timestamp' })
  timestamp: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: DataQuality.RAW,
    name: 'data_quality',
  })
  dataQuality: DataQuality;

  @Column({ type: 'boolean', default: false, name: 'is_outlier' })
  isOutlier: boolean;

  @Column({ type: 'text', nullable: true, name: 'filter_comment' })
  filterComment: string;

  @Column({ type: 'simple-json', nullable: true, name: 'metadata' })
  metadata: Record<string, any>;

  @ManyToOne(() => Sensor, (sensor) => sensor.readings, { onDelete: 'CASCADE' })
  sensor: Sensor;

  @Column({ name: 'sensor_id' })
  sensorId: string;
}
