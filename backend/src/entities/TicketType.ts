import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TimeSlot } from './TimeSlot';

@Entity()
export class TicketType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int', default: 1 })
  maxPerOrder!: number;

  @Column({ type: 'int', default: 0 })
  dailyLimit!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  refundDaysBefore!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  refundPercentage!: number;

  @Column({ type: 'boolean', default: false })
  allowReschedule!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TimeSlot, (slot) => slot.ticketType)
  timeSlots!: TimeSlot[];
}