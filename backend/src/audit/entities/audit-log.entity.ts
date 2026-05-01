import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from '../../contents/entities/content.entity';
import { ContentVersion } from '../../contents/entities/content-version.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 50, nullable: true })
  username: string;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'resource_type', length: 50 })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'resource_title', length: 500, nullable: true })
  resourceTitle: string;

  @Column({ name: 'old_value', type: 'simple-json', nullable: true })
  oldValue: any;

  @Column({ name: 'new_value', type: 'simple-json', nullable: true })
  newValue: any;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @Column({ name: 'request_path', length: 255, nullable: true })
  requestPath: string;

  @Column({ name: 'request_method', length: 10, nullable: true })
  requestMethod: string;

  @Column({ name: 'status_code', nullable: true })
  statusCode: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('sensitive_word_logs')
export class SensitiveWordLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { nullable: true })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id', nullable: true })
  contentId: string;

  @ManyToOne(() => ContentVersion, { nullable: true })
  @JoinColumn({ name: 'content_version_id' })
  contentVersion: ContentVersion;

  @Column({ name: 'content_version_id', nullable: true })
  contentVersionId: string;

  @Column({ name: 'matched_words', type: 'simple-json' })
  matchedWords: string[];

  @Column({ name: 'context_snippets', type: 'simple-json', nullable: true })
  contextSnippets: string[];

  @Column({ name: 'filtered_by', length: 100, default: 'system' })
  filteredBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
