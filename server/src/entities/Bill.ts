import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Community } from './Community';
import { Project } from './Project';

@Entity()
export class Bill {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('text')
  communityId: string;

  @Column('text')
  projectId: string;

  @Column('text')
  type: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('text')
  period: string;

  @Column('text')
  dueDate: string;

  @Column('text', { default: 'unpaid' })
  status: string;

  @Column('text', { nullable: true })
  paidAt: string;

  @Column('text', { nullable: true })
  paymentMethod: string;

  @Column('text', { nullable: true })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.bills)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Community, community => community.bills)
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
