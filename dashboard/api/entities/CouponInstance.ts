import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm'
import type { CouponInstanceStatus } from '../../../shared/types/index.js'
import { CouponActivity } from './CouponActivity.js'
import { User } from './User.js'
import { VerificationRecord } from './VerificationRecord.js'

@Entity('coupon_instances')
export class CouponInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  activityId: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  userId: string

  @ManyToOne(() => CouponActivity, (activity) => activity.couponInstances)
  activity: CouponActivity

  @ManyToOne(() => User, (user) => user.couponInstances)
  user: User

  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
  })
  code: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'available',
  })
  status: CouponInstanceStatus

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  issuedAt: Date

  @Column({
    type: 'datetime',
  })
  expiresAt: Date

  @Column({
    type: 'datetime',
    nullable: true,
  })
  usedAt: Date | null

  @OneToOne(() => VerificationRecord, (record) => record.couponInstance)
  verificationRecord: VerificationRecord

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
