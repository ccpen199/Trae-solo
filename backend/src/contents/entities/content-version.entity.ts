import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from './content.entity';
import { User } from '../../users/entities/user.entity';

@Entity('content_versions')
export class ContentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ length: 500 })
  title: string;

  @Column({ name: 'content_body', type: 'text', nullable: true })
  contentBody: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'featured_image_url', length: 500, nullable: true })
  featuredImageUrl: string;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
