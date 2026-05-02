import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ChannelType = 'direct' | 'taobao' | 'jd' | 'ctrip' | 'meituan';
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity()
export class ChannelSettlement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  settlementNo!: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  channel!: ChannelType;

  @Column({ type: 'date' })
  @Index()
  periodStart!: string;

  @Column({ type: 'date' })
  periodEnd!: string;

  @Column({ type: 'int', default: 0 })
  orderCount!: number;

  @Column({ type: 'int', default: 0 })
  ticketCount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSalesAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCommissionAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  commissionRate!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  settlementAmount!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @Index()
  status!: SettlementStatus;

  @Column({ nullable: true })
  processedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  remark?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}