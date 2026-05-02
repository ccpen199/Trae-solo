import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['date', 'timeSlotId', 'ticketTypeId'], { unique: true })
export class PassengerFlowLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  @Index()
  date!: string;

  @Column({ type: 'time', nullable: true })
  hour?: string;

  @Column({ nullable: true })
  timeSlotId?: string;

  @Column({ nullable: true })
  ticketTypeId?: string;

  @Column({ type: 'int', default: 0 })
  totalInbound!: number;

  @Column({ type: 'int', default: 0 })
  totalOutbound!: number;

  @Column({ type: 'int', default: 0 })
  currentInPark!: number;

  @CreateDateColumn()
  createdAt!: Date;
}