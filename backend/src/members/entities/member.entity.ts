import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MemberLevel, MemberStatus } from '../../common/types';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  memberNumber: string;

  @Column({ length: 50 })
  name: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: MemberLevel,
    default: MemberLevel.REGULAR,
  })
  level: MemberLevel;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE,
  })
  status: MemberStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'int', default: 0 })
  orderCount: number;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'simple-json', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'datetime', nullable: true })
  lastVisitAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
