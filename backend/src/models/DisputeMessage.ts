import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Dispute } from './Dispute';
import { User } from './User';

export enum MessageSender {
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
  PLATFORM = 'platform',
}

@Entity()
export class DisputeMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Dispute, dispute => dispute.messages)
  dispute: Dispute;

  @Column()
  disputeId: number;

  @ManyToOne(() => User)
  sender: User;

  @Column()
  senderId: number;

  @Column({
    type: 'simple-enum',
    enum: MessageSender,
  })
  senderType: MessageSender;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;
}
