import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GrowthStage } from './growth-stage.entity';

@Entity('crops')
export class Crop extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string;

  @Column({ type: 'int', name: 'total_growth_days', nullable: true })
  totalGrowthDays: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'optimal_season' })
  optimalSeason: string;

  @Column({ type: 'simple-json', nullable: true, name: 'optimal_soil_ph' })
  optimalSoilPh: { min: number; max: number };

  @OneToMany(() => GrowthStage, (growthStage) => growthStage.crop)
  growthStages: GrowthStage[];
}
