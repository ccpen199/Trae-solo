import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Crop } from './crop.entity';
import { EnvironmentThreshold } from './environment-threshold.entity';

export enum GrowthStageType {
  SEEDLING = 'seedling',
  VEGETATIVE = 'vegetative',
  FLOWERING = 'flowering',
  FRUITING = 'fruiting',
  RIPENING = 'ripening',
  HARVEST = 'harvest',
}

@Entity('growth_stages')
export class GrowthStage extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'stage_type',
  })
  stageType: GrowthStageType;

  @Column({ type: 'int', name: 'start_day' })
  startDay: number;

  @Column({ type: 'int', name: 'end_day' })
  endDay: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', name: 'order_index', default: 0 })
  orderIndex: number;

  @ManyToOne(() => Crop, (crop) => crop.growthStages, { onDelete: 'CASCADE' })
  crop: Crop;

  @Column({ name: 'crop_id' })
  cropId: string;

  @OneToMany(
    () => EnvironmentThreshold,
    (threshold) => threshold.growthStage,
  )
  thresholds: EnvironmentThreshold[];
}
