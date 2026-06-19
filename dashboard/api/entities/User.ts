import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm'
import type { UserStatus } from '../../../shared/types/index.js'
import { CouponInstance } from './CouponInstance.js'
import { UserProfile } from './UserProfile.js'
import { RiskEvent } from './RiskEvent.js'
import { VerificationRecord } from './VerificationRecord.js'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  realName: string

  @Column({
    type: 'varchar',
    length: 18,
    unique: true,
  })
  idCard: string

  @Column({
    type: 'varchar',
    length: 11,
    unique: true,
  })
  phone: string

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  deviceId: string | null

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  riskScore: number

  @Column({
    type: 'varchar',
    length: 20,
    default: 'normal',
  })
  status: UserStatus

  @OneToMany(() => CouponInstance, (instance) => instance.user)
  couponInstances: CouponInstance[]

  @OneToOne(() => UserProfile, (profile) => profile.user)
  userProfile: UserProfile

  @OneToMany(() => RiskEvent, (event) => event.user)
  riskEvents: RiskEvent[]

  @OneToMany(() => VerificationRecord, (record) => record.user)
  verificationRecords: VerificationRecord[]

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
