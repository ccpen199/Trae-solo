import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import type { RiskEventType, RiskLevel, RiskStatus, RiskEvidence } from '../../../shared/types/index.js'
import { User } from './User.js'

@Entity('risk_events')
export class RiskEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 30,
  })
  type: RiskEventType

  @Column({
    type: 'varchar',
    length: 20,
  })
  level: RiskLevel

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  userId: string | null

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  deviceId: string | null

  @ManyToOne(() => User, (user) => user.riskEvents)
  user: User | null

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  relatedAccounts: string[] | null

  @Column({
    type: 'simple-json',
  })
  evidence: RiskEvidence

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: RiskStatus

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  handlerId: string | null

  @Column({
    type: 'datetime',
    nullable: true,
  })
  handledAt: Date | null

  @Column({
    type: 'text',
    nullable: true,
  })
  handlerNotes: string | null

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  detectedAt: Date

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
