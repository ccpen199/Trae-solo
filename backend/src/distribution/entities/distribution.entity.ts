import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from '../../contents/entities/content.entity';
import { ContentVersion } from '../../contents/entities/content-version.entity';
import { DistributionChannel, DistributionStatus } from '../../common/enums';

@Entity('distributions')
export class Distribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => ContentVersion, { nullable: true })
  @JoinColumn({ name: 'content_version_id' })
  contentVersion: ContentVersion;

  @Column({ name: 'content_version_id', nullable: true })
  contentVersionId: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  channel: DistributionChannel;

  @Column({ name: 'channel_url', length: 500, nullable: true })
  channelUrl: string;

  @Column({ name: 'channel_content_id', length: 255, nullable: true })
  channelContentId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: DistributionStatus.PENDING,
  })
  status: DistributionStatus;

  @Column({ name: 'scheduled_at', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('distribution_schedules')
export class DistributionSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

  @Column({ type: 'simple-json' })
  channels: DistributionChannel[];

  @Column({ name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: DistributionStatus.PENDING,
  })
  status: DistributionStatus;

  @Column({ name: 'executed_at', nullable: true })
  executedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
