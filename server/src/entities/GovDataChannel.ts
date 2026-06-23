import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Community } from './Community';

@Entity()
export class GovDataChannel {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  communityId: string;

  @Column('text')
  channelName: string;

  @Column('text')
  channelType: string;

  @Column('simple-json', { nullable: true })
  config: Record<string, any>;

  @Column('text', { default: 'inactive' })
  status: string;

  @Column('text', { nullable: true })
  lastSyncAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Community, community => community.govChannels)
  @JoinColumn({ name: 'communityId' })
  community: Community;
}
