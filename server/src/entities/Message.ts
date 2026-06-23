import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Message {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('text')
  title: string;

  @Column('text')
  content: string;

  @Column('text', { default: 'inbox' })
  type: string;

  @Column('text', { default: 'system' })
  category: string;

  @Column('text', { default: 'unread' })
  status: string;

  @Column('simple-json', { nullable: true })
  channels: { sms?: boolean; inbox?: boolean; template?: boolean };

  @Column('simple-json', { nullable: true })
  meta: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.messages)
  @JoinColumn({ name: 'userId' })
  user: User;
}
