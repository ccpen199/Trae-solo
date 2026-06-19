import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import type { ConsumptionTier } from '../../../shared/types/index.js'
import { User } from './User.js'

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
  })
  userId: string

  @OneToOne(() => User, (user) => user.userProfile)
  @JoinColumn()
  user: User

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  consumptionTier: ConsumptionTier

  @Column({
    type: 'simple-json',
  })
  preferredCategories: string[]

  @Column({
    type: 'simple-json',
  })
  preferredDistricts: string[]

  @Column({
    type: 'int',
    default: 0,
  })
  historicalVerificationCount: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  historicalVerificationAmount: number

  @Column({
    type: 'datetime',
    nullable: true,
  })
  lastActiveAt: Date | null

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
