import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm'
import { LedgerEntry } from './LedgerEntry.entity'
import { PointsTransaction } from './PointsTransaction.entity'

export enum VoucherType {
  POINTS_EARN = 'points_earn',
  POINTS_SPEND = 'points_spend',
  POINTS_FREEZE = 'points_freeze',
  POINTS_UNFREEZE = 'points_unfreeze',
  POINTS_EXPIRE = 'points_expire',
  POINTS_ADJUST = 'points_adjust',
  POINTS_ROLLBACK = 'points_rollback',
}

export enum VoucherStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  CANCELLED = 'cancelled',
}

@Entity('ledger_vouchers')
export class LedgerVoucher {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  voucherNo: string

  @Column({
    type: 'simple-enum',
    enum: VoucherType,
  })
  type: VoucherType

  @Column({
    type: 'simple-enum',
    enum: VoucherStatus,
    default: VoucherStatus.PENDING,
  })
  status: VoucherStatus

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalDebit: number

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalCredit: number

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true })
  businessType: string

  @Column({ nullable: true })
  businessNo: string

  @Column({ nullable: true })
  memberId: string

  @OneToMany(() => LedgerEntry, (entry) => entry.voucher)
  entries: LedgerEntry[]

  @OneToMany(() => PointsTransaction, (transaction) => transaction.ledgerVoucher)
  transactions: PointsTransaction[]

  @Column({ nullable: true })
  operatorId: string

  @Column({ nullable: true, type: 'text' })
  metadata: string

  @CreateDateColumn()
  createdAt: Date

  @Column({ nullable: true })
  postedAt: Date

  @Column({ nullable: true })
  cancelledAt: Date
}
