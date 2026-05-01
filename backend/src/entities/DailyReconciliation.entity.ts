import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum ReconciliationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  WARNING = 'warning',
}

@Entity('daily_reconciliations')
export class DailyReconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  reconciliationNo: string

  @Column()
  date: Date

  @Column({
    type: 'simple-enum',
    enum: ReconciliationStatus,
    default: ReconciliationStatus.PENDING,
  })
  status: ReconciliationStatus

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  openingBalance: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  closingBalance: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalIssued: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalConsumed: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalExpired: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAdjusted: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalRollbacked: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  expectedBalance: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  actualBalance: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  difference: number

  @Column({ default: false })
  hasWarning: boolean

  @Column({ default: false })
  hasError: boolean

  @Column({ type: 'simple-json', nullable: true })
  warnings: Record<string, any>[]

  @Column({ type: 'simple-json', nullable: true })
  errors: Record<string, any>[]

  @Column({ type: 'simple-json', nullable: true })
  details: Record<string, any>

  @Column({ nullable: true })
  operatorId: string

  @Column({ nullable: true, type: 'text' })
  remark: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ nullable: true })
  startedAt: Date

  @Column({ nullable: true })
  completedAt: Date
}
