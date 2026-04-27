import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Crop } from '../../agronomy/entities/crop.entity';

export enum ModelStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
}

@Entity('standardized_models')
export class StandardizedModel extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float', name: 'target_yield_per_hectare' })
  targetYieldPerHectare: number;

  @Column({ type: 'int', name: 'total_growth_days' })
  totalGrowthDays: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'optimal_region' })
  optimalRegion: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ModelStatus.DRAFT,
  })
  status: ModelStatus;

  @Column({ type: 'simple-json', nullable: true, name: 'growth_stage_configs' })
  growthStageConfigs: {
    stageType: string;
    stageName: string;
    startDay: number;
    endDay: number;
    durationDays: number;
    environmentThresholds: {
      parameterType: string;
      thresholdType: string;
      minValue: number;
      maxValue: number;
      optimalValue: number;
      unit: string;
    }[];
    keyActions: {
      actionType: string;
      actionName: string;
      recommendedDay: number;
      details: string;
    }[];
  }[];

  @Column({ type: 'simple-json', nullable: true, name: 'irrigation_schedule' })
  irrigationSchedule: {
    stageType: string;
    frequencyPerDay: number;
    durationPerIrrigation: number;
    targetSoilMoisture: number;
    timingWindows: string[];
  }[];

  @Column({ type: 'simple-json', nullable: true, name: 'fertilization_schedule' })
  fertilizationSchedule: {
    stageType: string;
    growthDay: number;
    fertilizerType: string;
    quantity: number;
    unit: string;
    applicationMethod: string;
  }[];

  @Column({ type: 'simple-json', nullable: true, name: 'pest_control_guidelines' })
  pestControlGuidelines: {
    stageType: string;
    commonPests: string[];
    preventionMethods: string[];
    treatmentOptions: {
      pestType: string;
      chemicalName: string;
      dosage: string;
      safetyPeriod: number;
    }[];
  }[];

  @Column({ type: 'simple-json', nullable: true, name: 'environmental_controls' })
  environmentalControls: {
    stageType: string;
    temperatureControl: {
      enabled: boolean;
      targetMin: number;
      targetMax: number;
      heatingThreshold: number;
      coolingThreshold: number;
    };
    humidityControl: {
      enabled: boolean;
      targetMin: number;
      targetMax: number;
      humidificationThreshold: number;
      dehumidificationThreshold: number;
    };
    lightControl: {
      enabled: boolean;
      targetLightHours: number;
      supplementalLighting: boolean;
    };
    co2Control: {
      enabled: boolean;
      targetCo2Level: number;
    };
  }[];

  @Column({ type: 'text', nullable: true, name: 'key_success_factors' })
  keySuccessFactors: string;

  @Column({ type: 'text', nullable: true, name: 'risk_warnings' })
  riskWarnings: string;

  @Column({ type: 'int', default: 0, name: 'usage_count' })
  usageCount: number;

  @Column({ type: 'float', nullable: true, name: 'average_yield_ratio' })
  averageYieldRatio: number;

  @ManyToOne(() => Crop, { nullable: true })
  crop: Crop;

  @Column({ name: 'crop_id', nullable: true })
  cropId: string;
}
