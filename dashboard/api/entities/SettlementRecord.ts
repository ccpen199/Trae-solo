import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'
import type { SettlementStatus } from '../../../shared/types/index.js'
import { Merchant } from './Merchant.js'
import { VerificationRecord } from './VerificationRecord.js'

@Entity('settlement_records')
export class SettlementRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  merchantId: string

  @ManyToOne(() => Merchant, (merchant) => merchant.settlementRecords)
  merchant: Merchant

  @Column({
    type: 'date',
  })
  periodStart: Date

  @Column({
    type: 'date',
  })
  periodEnd: Date

  @Column({
    type: 'int',
    default: 0,
  })
  totalVerifications: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  subsidyAmount: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  actualAmount: number

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: SettlementStatus

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  provincialBatchId: string | null

  @Column({
    type: 'datetime',
    nullable: true,
  })
  transferTime: Date | null

  @OneToMany(() => VerificationRecord, (record) => record.settlementRecord)
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
