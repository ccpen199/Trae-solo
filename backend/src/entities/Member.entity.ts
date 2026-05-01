import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { User } from './User.entity'
import { PointsAccount } from './PointsAccount.entity'
import { PointsTransaction } from './PointsTransaction.entity'
import { ExchangeOrder } from './ExchangeOrder.entity'

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToOne(() => User, (user) => user.member)
  @JoinColumn()
  user: User

  @Column()
  userId: string

  @Column({ unique: true })
  memberNo: string

  @Column({ default: 0 })
  level: number

  @Column({ default: 0 })
  totalConsumption: number

  @Column({ default: 0 })
  totalPointsEarned: number

  @Column({ default: 0 })
  totalPointsSpent: number

  @Column({ default: 0 })
  totalPointsExpired: number

  @OneToOne(() => PointsAccount, (account) => account.member)
  pointsAccount: PointsAccount

  @OneToMany(() => PointsTransaction, (transaction) => transaction.member)
  transactions: PointsTransaction[]

  @OneToMany(() => ExchangeOrder, (order) => order.member)
  exchangeOrders: ExchangeOrder[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
