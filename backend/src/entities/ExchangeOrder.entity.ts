import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Member } from './Member.entity'

export enum ExchangeOrderStatus {
  CREATED = 'created',
  FROZEN = 'frozen',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  ROLLBACKED = 'rollbacked',
}

export enum ExchangeType {
  PRODUCT = 'product',
  COUPON = 'coupon',
  SERVICE = 'service',
  CASH = 'cash',
}

@Entity('exchange_orders')
export class ExchangeOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  orderNo: string

  @ManyToOne(() => Member, (member) => member.exchangeOrders)
  @JoinColumn()
  member: Member

  @Column()
  memberId: string

  @Column({
    type: 'simple-enum',
    enum: ExchangeType,
  })
  exchangeType: ExchangeType

  @Column({
    type: 'simple-enum',
    enum: ExchangeOrderStatus,
    default: ExchangeOrderStatus.CREATED,
  })
  status: ExchangeOrderStatus

  @Column()
  itemId: string

  @Column()
  itemName: string

  @Column({ type: 'simple-json', nullable: true })
  itemDetails: Record<string, any>

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  pointsPerUnit: number

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  totalPoints: number

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  frozenPoints: number

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  deductedPoints: number

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  rolledbackPoints: number

  @Column({ nullable: true })
  freezeTransactionId: string

  @Column({ nullable: true })
  deductTransactionId: string

  @Column({ nullable: true })
  rollbackTransactionId: string

  @Column({ nullable: true })
  freezeVoucherId: string

  @Column({ nullable: true })
  deductVoucherId: string

  @Column({ nullable: true })
  rollbackVoucherId: string

  @Column({ nullable: true })
  freezeExpiresAt: Date

  @Column({ nullable: true, type: 'text' })
  failureReason: string

  @Column({ nullable: true })
  operatorId: string

  @Column({ nullable: true, type: 'text' })
  metadata: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ nullable: true })
  frozenAt: Date

  @Column({ nullable: true })
  confirmedAt: Date

  @Column({ nullable: true })
  completedAt: Date

  @Column({ nullable: true })
  cancelledAt: Date

  @Column({ nullable: true })
  failedAt: Date

  @Column({ nullable: true })
  rollbackedAt: Date
}
