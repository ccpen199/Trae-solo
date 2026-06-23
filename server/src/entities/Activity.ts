import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Community } from './Community';
import { ActivityRegistration } from './ActivityRegistration';

@Entity()
export class Activity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  communityId: string;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('simple-json', { nullable: true })
  images: string[];

  @Column('text')
  location: string;

  @Column('text')
  startDate: string;

  @Column('text')
  endDate: string;

  @Column('text')
  startTime: string;

  @Column('text')
  endTime: string;

  @Column('integer', { default: 0 })
  maxParticipants: number;

  @Column('text', { default: 'published' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Community, community => community.activities)
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @OneToMany(() => ActivityRegistration, reg => reg.activity)
  registrations: ActivityRegistration[];
}
