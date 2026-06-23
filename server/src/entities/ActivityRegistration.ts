import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Activity } from './Activity';

@Entity()
export class ActivityRegistration {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  activityId: string;

  @Column('text')
  userId: string;

  @Column('text', { nullable: true })
  contactName: string;

  @Column('text', { nullable: true })
  contactPhone: string;

  @Column('integer', { default: 1 })
  participantCount: number;

  @Column('text', { default: 'registered' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Activity, activity => activity.registrations)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @ManyToOne(() => User, user => user.activityRegistrations)
  @JoinColumn({ name: 'userId' })
  user: User;
}
