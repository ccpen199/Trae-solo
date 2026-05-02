import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Order } from './Order';
import { TimeSlot } from './TimeSlot';
import { TicketType } from './TicketType';

export type TicketCodeStatus = 'valid' | 'used' | 'refunded' | 'expired' | 'cancelled';

@Entity()
export class TicketCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  code!: string;

  @Column()
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.ticketCodes)
  order!: Order;

  @Column()
  ticketTypeId!: string;

  @ManyToOne(() => TicketType)
  ticketType!: TicketType;

  @Column()
  timeSlotId!: string;

  @ManyToOne(() => TimeSlot)
  timeSlot!: TimeSlot;

  @Column({ type: 'varchar', length: 50, default: 'valid' })
  @Index()
  status!: TicketCodeStatus;

  @Column({ type: 'date' })
  validDate!: string;

  @Column({ type: 'time' })
  validStartTime!: string;

  @Column({ type: 'time' })
  validEndTime!: string;

  @Column({ nullable: true })
  usedAt?: Date;

  @Column({ nullable: true })
  usedBy?: string;

  @Column({ type: 'text', nullable: true })
  qrCodeData?: string;

  @Column({ type: 'text', nullable: true })
  qrCodeBase64?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}