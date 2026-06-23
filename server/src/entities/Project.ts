import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Community } from './Community';

@Entity()
export class Project {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  type: string;

  @Column('text')
  communityId: string;

  @Column('simple-json', { nullable: true })
  config: Record<string, any>;

  @Column('text', { default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Community, community => community.projects)
  @JoinColumn({ name: 'communityId' })
  community: Community;
}
