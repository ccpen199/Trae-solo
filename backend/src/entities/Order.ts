import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User';
import { TicketCode } from './TicketCode';

export type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'refunding' | 'refunded' | 'cancelled' | 'expired';
export type ChannelType = 'direct' | 'taobao' | 'jd' | 'ctrip' | 'meituan';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  orderNo!: string;

  @Column({ type: 'varchar', length: 50 })
  channel!: ChannelType;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionAmount!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @Index()
  status!: OrderStatus;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  confirmedAt?: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string;

  @Column({ nullable: true })
  touristId?: string;

  @ManyToOne(() => User, { nullable: true })
  tourist?: User;

  @Column({ nullable: true })
  touristName?: string;

  @Column({ nullable: true })
  touristPhone?: string;

  @Column({ nullable: true })
  operatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  operator?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TicketCode, (ticketCode) => ticketCode.order)
  ticketCodes!: TicketCode[];
}