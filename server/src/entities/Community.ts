import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from './Project';
import { User } from './User';
import { Bill } from './Bill';
import { Announcement } from './Announcement';
import { Activity } from './Activity';
import { GovDataChannel } from './GovDataChannel';

@Entity()
export class Community {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  address: string;

  @Column('text')
  city: string;

  @Column('text')
  district: string;

  @Column('text', { nullable: true })
  developer: string;

  @Column('integer', { nullable: true })
  buildYear: number;

  @Column('integer', { nullable: true })
  totalBuildings: number;

  @Column('integer', { nullable: true })
  totalUnits: number;

  @Column('text', { nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Project, project => project.community)
  projects: Project[];

  @OneToMany(() => User, user => user.community)
  users: User[];

  @OneToMany(() => Bill, bill => bill.community)
  bills: Bill[];

  @OneToMany(() => Announcement, announcement => announcement.community)
  announcements: Announcement[];

  @OneToMany(() => Activity, activity => activity.community)
  activities: Activity[];

  @OneToMany(() => GovDataChannel, channel => channel.community)
  govChannels: GovDataChannel[];
}
