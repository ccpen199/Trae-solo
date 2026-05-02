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
import { TicketType } from './TicketType';
import { Inventory } from './Inventory';

@Entity()
@Index(['ticketTypeId', 'date', 'startTime'], { unique: true })
export class TimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ticketTypeId!: string;

  @ManyToOne(() => TicketType, (ticketType) => ticketType.timeSlots)
  ticketType!: TicketType;

  @Column({ type: 'date' })
  @Index()
  date!: string;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'int', default: 0 })
  capacity!: number;

  @Column({ type: 'int', default: 0 })
  booked!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Inventory, (inventory) => inventory.timeSlot)
  inventories!: Inventory[];
}