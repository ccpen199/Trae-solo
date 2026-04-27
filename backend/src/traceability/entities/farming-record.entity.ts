import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Crop } from '../../agronomy/entities/crop.entity';
import { GrowthStage } from '../../agronomy/entities/growth-stage.entity';
import { ControlCommand } from '../../control/entities/control-command.entity';
import { HighYieldAnalysis } from './high-yield-analysis.entity';

export enum FarmingRecordType {
  IRRIGATION = 'irrigation',
  FERTILIZATION = 'fertilization',
  PEST_CONTROL = 'pest_control',
  PRUNING = 'pruning',
  HARVEST = 'harvest',
  PLANTING = 'planting',
  TRANSPLANTING = 'transplanting',
  OTHER = 'other',
}

export enum HarvestQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  AVERAGE = 'average',
  POOR = 'poor',
}

@Entity('farming_records')
export class FarmingRecord extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    name: 'record_type',
  })
  recordType: FarmingRecordType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'datetime', name: 'occurred_at' })
  occurredAt: Date;

  @Column({ type: 'varchar', length: 50, name: 'location_zone' })
  locationZone: string;

  @Column({ type: 'int', nullable: true, name: 'growth_day' })
  growthDay: number;

  @Column({ type: 'float', nullable: true, name: 'quantity' })
  quantity: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'quantity_unit' })
  quantityUnit: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'operator_id' })
  operatorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'operator_name' })
  operatorName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'harvest_quality',
  })
  harvestQuality: HarvestQuality;

  @Column({ type: 'float', nullable: true, name: 'yield_per_hectare' })
  yieldPerHectare: number;

  @Column({ type: 'simple-json', nullable: true, name: 'environment_snapshot' })
  environmentSnapshot: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    soilPh: number;
    lightIntensity: number;
    co2Level: number;
  };

  @Column({ type: 'simple-json', nullable: true, name: 'additional_data' })
  additionalData: Record<string, any>;

  @ManyToOne(() => Crop, { nullable: true })
  crop: Crop;

  @Column({ name: 'crop_id', nullable: true })
  cropId: string;

  @ManyToOne(() => GrowthStage, { nullable: true })
  growthStage: GrowthStage;

  @Column({ name: 'growth_stage_id', nullable: true })
  growthStageId: string;

  @OneToMany(() => ControlCommand, (command) => command.farmingRecord)
  commands: ControlCommand[];

  @OneToMany(() => HighYieldAnalysis, (analysis) => analysis.referenceRecord)
  highYieldAnalyses: HighYieldAnalysis[];
}
