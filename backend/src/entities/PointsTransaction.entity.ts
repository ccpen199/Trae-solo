import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Member } from './Member.entity'
import { LedgerVoucher } from './LedgerVoucher.entity'

export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
  EXPIRE = 'expire',
  ADJUST = 'adjust',
  ROLLBACK = 'rollback',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('points_transactions')
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  transactionNo: string

  @ManyToOne(() => Member, (member) => member.transactions)
  @JoinColumn()
  member: Member

  @Column()
  memberId: string

  @Column({
    type: 'simple-enum',
    enum: TransactionType,
  })
  type: TransactionType

  @Column({
    type: 'simple-enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  balanceBefore: number

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  balanceAfter: number

  @Column({ nullable: true })
  businessType: string

  @Column({ nullable: true })
  businessNo: string

  @Column({ nullable: true })
  ruleId: string

  @Column({ nullable: true })
  description: string

  @ManyToOne(() => LedgerVoucher, (voucher) => voucher.transactions)
  @JoinColumn()
  ledgerVoucher: LedgerVoucher

  @Column({ nullable: true })
  ledgerVoucherId: string

  @Column({ nullable: true })
  expiryDate: Date

  @Column({ default: false })
  isExpired: boolean

  @Column({ nullable: true })
  source: string

  @Column({ nullable: true })
  operatorId: string

  @Column({ nullable: true, type: 'text' })
  metadata: string

  @CreateDateColumn()
  createdAt: Date

  @Column({ nullable: true })
  confirmedAt: Date
}
