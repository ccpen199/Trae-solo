import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { TicketCode } from './TicketCode';
import { User } from './User';

@Entity()
export class VerificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ticketCodeId!: string;

  @ManyToOne(() => TicketCode)
  ticketCode!: TicketCode;

  @Column({ unique: true })
  @Index()
  code!: string;

  @Column({ type: 'date' })
  @Index()
  date!: string;

  @Column({ type: 'time' })
  time!: string;

  @Column()
  checkerId!: string;

  @ManyToOne(() => User)
  checker!: User;

  @Column({ nullable: true })
  deviceId?: string;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 50, default: 'success' })
  result!: 'success' | 'failed';

  @Column({ type: 'text', nullable: true })
  failReason?: string;

  @CreateDateColumn()
  createdAt!: Date;
}