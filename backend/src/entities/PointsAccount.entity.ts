import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  VersionColumn,
} from 'typeorm'
import { Member } from './Member.entity'

@Entity('points_accounts')
export class PointsAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToOne(() => Member, (member) => member.pointsAccount)
  @JoinColumn()
  member: Member

  @Column()
  memberId: string

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalBalance: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  availableBalance: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  frozenBalance: number

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  pendingBalance: number

  @VersionColumn()
  version: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
