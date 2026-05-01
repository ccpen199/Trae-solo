import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum RuleType {
  CONSUMPTION = 'consumption',
  CHECK_IN = 'check_in',
  BIRTHDAY = 'birthday',
  REGISTRATION = 'registration',
  REFERAL = 'referal',
  ACTIVITY = 'activity',
}

export enum RuleStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity('rule_configs')
export class RuleConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  ruleCode: string

  @Column()
  name: string

  @Column({
    type: 'simple-enum',
    enum: RuleType,
  })
  type: RuleType

  @Column({
    type: 'simple-enum',
    enum: RuleStatus,
    default: RuleStatus.DRAFT,
  })
  status: RuleStatus

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'simple-json' })
  conditions: Record<string, any>

  @Column({ type: 'simple-json' })
  actions: Record<string, any>

  @Column({ type: 'simple-json', nullable: true })
  constraints: Record<string, any>

  @Column({ type: 'int', default: 1 })
  priority: number

  @Column({ nullable: true })
  startDate: Date

  @Column({ nullable: true })
  endDate: Date

  @Column({ default: 0 })
  triggerCount: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalPointsAwarded: number

  @Column({ nullable: true })
  maxTriggers: number

  @Column({ nullable: true, type: 'decimal', precision: 18, scale: 2 })
  maxPoints: number

  @Column({ nullable: true })
  operatorId: string

  @Column({ nullable: true })
  approvedBy: string

  @Column({ nullable: true })
  approvedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
