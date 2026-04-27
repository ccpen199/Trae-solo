import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FarmingRecord } from './farming-record.entity';
import { Crop } from '../../agronomy/entities/crop.entity';
import { GrowthStage } from '../../agronomy/entities/growth-stage.entity';

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('high_yield_analyses')
export class HighYieldAnalysis extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AnalysisStatus.PENDING,
  })
  status: AnalysisStatus;

  @Column({ type: 'float', name: 'target_yield_per_hectare' })
  targetYieldPerHectare: number;

  @Column({ type: 'float', nullable: true, name: 'actual_yield_per_hectare' })
  actualYieldPerHectare: number;

  @Column({ type: 'int', nullable: true, name: 'start_growth_day' })
  startGrowthDay: number;

  @Column({ type: 'int', nullable: true, name: 'end_growth_day' })
  endGrowthDay: number;

  @Column({ type: 'simple-json', nullable: true, name: 'optimal_environment_profile' })
  optimalEnvironmentProfile: {
    temperature: { min: number; max: number; optimal: number };
    humidity: { min: number; max: number; optimal: number };
    soilMoisture: { min: number; max: number; optimal: number };
    soilPh: { min: number; max: number; optimal: number };
    lightIntensity: { min: number; max: number; optimal: number };
    co2Level: { min: number; max: number; optimal: number };
  };

  @Column({ type: 'simple-json', nullable: true, name: 'irrigation_pattern' })
  irrigationPattern: {
    frequencyPerDay: number;
    durationPerIrrigation: number;
    totalVolumePerDay: number;
    timingWindows: string[];
  };

  @Column({ type: 'simple-json', nullable: true, name: 'fertilization_schedule' })
  fertilizationSchedule: {
    growthDay: number;
    fertilizerType: string;
    quantity: number;
    unit: string;
  }[];

  @Column({ type: 'simple-json', nullable: true, name: 'pest_control_actions' })
  pestControlActions: {
    growthDay: number;
    pestType: string;
    controlMethod: string;
    chemicalName: string;
  }[];

  @Column({ type: 'simple-json', nullable: true, name: 'key_success_factors' })
  keySuccessFactors: {
    factor: string;
    importance: number;
    description: string;
  }[];

  @Column({ type: 'simple-json', nullable: true, name: 'growth_stage_analysis' })
  growthStageAnalysis: {
    stageType: string;
    durationDays: number;
    environmentStats: Record<string, any>;
    keyActions: string[];
  }[];

  @Column({ type: 'text', nullable: true, name: 'recommendations' })
  recommendations: string;

  @Column({ type: 'boolean', default: false, name: 'is_standardized' })
  isStandardized: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'analyzed_at' })
  analyzedAt: Date;

  @ManyToOne(() => FarmingRecord, (record) => record.highYieldAnalyses, {
    nullable: true,
  })
  referenceRecord: FarmingRecord;

  @Column({ name: 'reference_record_id', nullable: true })
  referenceRecordId: string;

  @ManyToOne(() => Crop, { nullable: true })
  crop: Crop;

  @Column({ name: 'crop_id', nullable: true })
  cropId: string;

  @ManyToOne(() => GrowthStage, { nullable: true })
  growthStage: GrowthStage;

  @Column({ name: 'growth_stage_id', nullable: true })
  growthStageId: string;
}
