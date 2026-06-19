import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import type { DistributionStrategyType, GeofenceArea, AutoTriggerCondition } from '../../../shared/types/index.js'
import { CouponActivity } from './CouponActivity.js'

@Entity('distribution_strategies')
export class DistributionStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 20,
  })
  type: DistributionStrategyType

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  targetedGroups: string[] | null

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  geofencingAreas: GeofenceArea[] | null

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  autoTriggerConditions: AutoTriggerCondition | null

  @OneToOne(() => CouponActivity, (activity) => activity.distributionStrategy)
  couponActivity: CouponActivity

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date
}
