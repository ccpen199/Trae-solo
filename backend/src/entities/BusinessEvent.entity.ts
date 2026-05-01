import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

export enum EventType {
  CONSUMPTION = 'consumption',
  CHECK_IN = 'check_in',
  BIRTHDAY = 'birthday',
  REGISTRATION = 'registration',
  REFERAL = 'referal',
  ACTIVITY_PARTICIPATION = 'activity_participation',
  FIRST_ORDER = 'first_order',
  LEVEL_UP = 'level_up',
}

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity('business_events')
export class BusinessEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  eventNo: string

  @Column({
    type: 'simple-enum',
    enum: EventType,
  })
  type: EventType

  @Column({
    type: 'simple-enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus

  @Column()
  memberId: string

  @Column({ nullable: true })
  businessNo: string

  @Column({ type: 'simple-json' })
  eventData: Record<string, any>

  @Column({ type: 'simple-json', nullable: true })
  matchedRules: string[]

  @Column({ type: 'simple-json', nullable: true })
  triggeredActions: Record<string, any>[]

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalPointsAwarded: number

  @Column({ nullable: true, type: 'text' })
  errorMessage: string

  @Column({ default: 0 })
  retryCount: number

  @Column({ nullable: true })
  nextRetryAt: Date

  @CreateDateColumn()
  createdAt: Date

  @Column({ nullable: true })
  startedAt: Date

  @Column({ nullable: true })
  completedAt: Date
}
