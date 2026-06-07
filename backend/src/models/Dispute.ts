import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Order } from './Order';
import { User } from './User';
import { DisputeMessage } from './DisputeMessage';

export enum DisputeStatus {
  OPEN = 'open',
  NEGOTIATING = 'negotiating',
  AWAITING_ARBITRATION = 'awaiting_arbitration',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum DisputeType {
  QUALITY = 'quality',
  PRICING = 'pricing',
  TIMELINE = 'timeline',
  BEHAVIOR = 'behavior',
  OTHER = 'other',
}

export enum ArbitrationResult {
  CUSTOMER_WINS = 'customer_wins',
  PROVIDER_WINS = 'provider_wins',
  SPLIT = 'split',
  NONE = 'none',
}

@Entity()
export class Dispute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.disputes)
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => User)
  initiator: User;

  @Column()
  initiatorId: number;

  @Column({
    type: 'simple-enum',
    enum: DisputeType,
  })
  type: DisputeType;

  @Column({
    type: 'simple-enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  evidence: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  requestedRefund: number;

  @Column({
    type: 'simple-enum',
    enum: ArbitrationResult,
    default: ArbitrationResult.NONE,
  })
  arbitrationResult: ArbitrationResult;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  arbitrationRefund: number;

  @Column({ type: 'text', nullable: true })
  arbitrationNotes: string;

  @Column({ nullable: true })
  arbitratorId: number;

  @Column({ type: 'datetime', nullable: true })
  arbitrationTime: Date;

  @OneToMany(() => DisputeMessage, message => message.dispute)
  messages: DisputeMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
