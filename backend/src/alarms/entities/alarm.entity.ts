import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sensor } from '../../sensors/entities/sensor.entity';
import { GrowthStage } from '../../agronomy/entities/growth-stage.entity';
import { EnvironmentThreshold } from '../../agronomy/entities/environment-threshold.entity';
import { AlarmAction } from './alarm-action.entity';

export enum AlarmSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlarmStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
}

export enum AlarmType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  SENSOR_OFFLINE = 'sensor_offline',
  EQUIPMENT_FAILURE = 'equipment_failure',
  MAINTENANCE_REQUIRED = 'maintenance_required',
}

@Entity('alarms')
export class Alarm extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    name: 'alarm_type',
  })
  alarmType: AlarmType;

  @Column({
    type: 'varchar',
    length: 50,
    default: AlarmSeverity.WARNING,
  })
  severity: AlarmSeverity;

  @Column({
    type: 'varchar',
    length: 50,
    default: AlarmStatus.OPEN,
  })
  status: AlarmStatus;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float', name: 'actual_value', nullable: true })
  actualValue: number;

  @Column({ type: 'float', name: 'threshold_min', nullable: true })
  thresholdMin: number;

  @Column({ type: 'float', name: 'threshold_max', nullable: true })
  thresholdMax: number;

  @Column({ type: 'datetime', name: 'triggered_at' })
  triggeredAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'acknowledged_at' })
  acknowledgedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'acknowledged_by' })
  acknowledgedBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'resolved_by' })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true, name: 'resolution_notes' })
  resolutionNotes: string;

  @Column({ type: 'simple-json', nullable: true, name: 'weather_forecast' })
  weatherForecast: {
    predictedRain: boolean;
    rainProbability: number;
    hoursUntilRain: number;
    adjustedSeverity: AlarmSeverity;
    adjustmentReason: string;
  };

  @Column({ type: 'boolean', default: false, name: 'is_adjusted' })
  isAdjusted: boolean;

  @ManyToOne(() => Sensor, { nullable: true })
  sensor: Sensor;

  @Column({ name: 'sensor_id', nullable: true })
  sensorId: string;

  @ManyToOne(() => GrowthStage, { nullable: true })
  growthStage: GrowthStage;

  @Column({ name: 'growth_stage_id', nullable: true })
  growthStageId: string;

  @ManyToOne(() => EnvironmentThreshold, { nullable: true })
  threshold: EnvironmentThreshold;

  @Column({ name: 'threshold_id', nullable: true })
  thresholdId: string;

  @OneToMany(() => AlarmAction, (action) => action.alarm)
  actions: AlarmAction[];
}
