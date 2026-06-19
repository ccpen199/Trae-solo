import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm'
import type { TerminalType, VerificationStatus, GeoLocation } from '../../../shared/types/index.js'
import { CouponInstance } from './CouponInstance.js'
import { CouponActivity } from './CouponActivity.js'
import { User } from './User.js'
import { Merchant } from './Merchant.js'
import { Store } from './Store.js'
import { POSTerminal } from './POSTerminal.js'
import { SettlementRecord } from './SettlementRecord.js'

@Entity('verification_records')
export class VerificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  couponInstanceId: string

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

  @Column({
    type: 'varchar',
    length: 64,
  })
  merchantId: string

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  storeId: string | null

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  terminalId: string | null

  @OneToOne(() => CouponInstance, (instance) => instance.verificationRecord)
  @JoinColumn()
  couponInstance: CouponInstance

  @ManyToOne(() => CouponActivity)
  activity: CouponActivity

  @ManyToOne(() => User, (user) => user.verificationRecords)
  user: User

  @ManyToOne(() => Merchant, (merchant) => merchant.verificationRecords)
  merchant: Merchant

  @ManyToOne(() => Store)
  store: Store | null

  @ManyToOne(() => POSTerminal, (terminal) => terminal.verificationRecords)
  terminal: POSTerminal | null

  @Column({
    type: 'varchar',
    length: 20,
  })
  terminalType: TerminalType

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  originalAmount: number

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  discountAmount: number

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number

  @Column({
    type: 'varchar',
    length: 20,
    default: 'success',
  })
  status: VerificationStatus

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  verifiedAt: Date

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  location: GeoLocation | null

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  orderNo: string | null

  @ManyToOne(() => SettlementRecord, (record) => record.verificationRecords)
  settlementRecord: SettlementRecord | null

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  settlementRecordId: string | null

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
