import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Community } from './Community';
import { Project } from './Project';

@Entity()
export class WorkOrder {
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

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('simple-json', { nullable: true })
  images: string[];

  @Column('simple-json', { nullable: true })
  location: { lat: number; lng: number; address: string };

  @Column('text', { default: 'pending' })
  status: string;

  @Column('text', { nullable: true })
  assignedToId: string;

  @Column('text', { default: 'medium' })
  priority: string;

  @Column('text', { nullable: true })
  completedAt: string;

  @Column('integer', { nullable: true })
  rating: number;

  @Column('text', { nullable: true })
  ratingComment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.workOrders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;
}
