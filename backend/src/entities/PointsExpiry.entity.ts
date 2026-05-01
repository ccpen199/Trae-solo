import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum ExpiryStatus {
  ACTIVE = 'active',
  NOTIFIED = 'notified',
  EXPIRED = 'expired',
  CLEARED = 'cleared',
}

@Entity('points_expiries')
export class PointsExpiry {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  expiryNo: string

  @Column()
  memberId: string

  @Column()
  transactionId: string

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  originalPoints: number

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  remainingPoints: number

  @Column()
  earnedDate: Date

  @Column()
  expiryDate: Date

  @Column({
    type: 'simple-enum',
    enum: ExpiryStatus,
    default: ExpiryStatus.ACTIVE,
  })
  status: ExpiryStatus

  @Column({ default: false })
  isNotified: boolean

  @Column({ default: 0 })
  notifyCount: number

  @Column({ nullable: true })
  lastNotifyAt: Date

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  expiredPoints: number

  @Column({ nullable: true })
  expiredTransactionId: string

  @Column({ nullable: true })
  expiredVoucherId: string

  @Column({ nullable: true, type: 'text' })
  metadata: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ nullable: true })
  expiredAt: Date

  @Column({ nullable: true })
  clearedAt: Date
}
