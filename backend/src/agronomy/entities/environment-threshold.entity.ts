import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GrowthStage } from './growth-stage.entity';

export enum EnvironmentParameter {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  SOIL_MOISTURE = 'soil_moisture',
  SOIL_PH = 'soil_ph',
  LIGHT_INTENSITY = 'light_intensity',
  CO2_LEVEL = 'co2_level',
  WIND_SPEED = 'wind_speed',
  RAINFALL = 'rainfall',
}

export enum ThresholdType {
  WARNING = 'warning',
  CRITICAL = 'critical',
  OPTIMAL = 'optimal',
}

@Entity('environment_thresholds')
export class EnvironmentThreshold extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    name: 'parameter_type',
  })
  parameterType: EnvironmentParameter;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'threshold_type',
  })
  thresholdType: ThresholdType;

  @Column({ type: 'float', name: 'min_value', nullable: true })
  minValue: number;

  @Column({ type: 'float', name: 'max_value', nullable: true })
  maxValue: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true, name: 'recommendation' })
  recommendation: string;

  @ManyToOne(() => GrowthStage, (growthStage) => growthStage.thresholds, {
    onDelete: 'CASCADE',
  })
  growthStage: GrowthStage;

  @Column({ name: 'growth_stage_id' })
  growthStageId: string;
}
