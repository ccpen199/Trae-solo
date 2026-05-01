import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { LedgerVoucher } from './LedgerVoucher.entity'

export enum EntryDirection {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum AccountType {
  MEMBER_POINTS = 'member_points',
  POINTS_RESERVE = 'points_reserve',
  POINTS_FROZEN = 'points_frozen',
  POINTS_PENDING = 'points_pending',
  POINTS_EXPIRED = 'points_expired',
}

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  entryNo: string

  @ManyToOne(() => LedgerVoucher, (voucher) => voucher.entries)
  @JoinColumn()
  voucher: LedgerVoucher

  @Column()
  voucherId: string

  @Column({
    type: 'simple-enum',
    enum: EntryDirection,
  })
  direction: EntryDirection

  @Column({
    type: 'simple-enum',
    enum: AccountType,
  })
  accountType: AccountType

  @Column({ nullable: true })
  accountRef: string

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number

  @Column({ nullable: true })
  memberId: string

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true, type: 'text' })
  metadata: string

  @CreateDateColumn()
  createdAt: Date
}
