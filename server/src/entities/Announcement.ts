import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Community } from './Community';

@Entity()
export class Announcement {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  communityId: string;

  @Column('text')
  title: string;

  @Column('text')
  content: string;

  @Column('text', { default: 'general' })
  category: string;

  @Column('integer', { default: 0 })
  viewCount: number;

  @Column('text', { default: 'published' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Community, community => community.announcements)
  @JoinColumn({ name: 'communityId' })
  community: Community;
}
