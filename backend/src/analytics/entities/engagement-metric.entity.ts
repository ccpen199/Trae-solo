import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from '../../contents/entities/content.entity';
import { DistributionChannel } from '../../common/enums';

@Entity('engagement_metrics')
export class EngagementMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  channel: DistributionChannel;

  @Column({ name: 'view_count', type: 'bigint', default: 0 })
  viewCount: number;

  @Column({ name: 'like_count', type: 'bigint', default: 0 })
  likeCount: number;

  @Column({ name: 'comment_count', type: 'bigint', default: 0 })
  commentCount: number;

  @Column({ name: 'share_count', type: 'bigint', default: 0 })
  shareCount: number;

  @Column({ name: 'favorite_count', type: 'bigint', default: 0 })
  favoriteCount: number;

  @Column({ name: 'collected_at', type: 'date' })
  collectedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
