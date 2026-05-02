import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { User } from './User';
import { Attachment } from './Attachment';

export enum CommentType {
  COMMENT = 'comment',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  INQUIRY = 'inquiry',
  REMINDER = 'reminder',
  INSTRUCTION = 'instruction',
}

export enum ApprovalResult {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
}

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'simple-enum', enum: CommentType, default: CommentType.COMMENT })
  type!: CommentType;

  @Column({ name: 'type_display', type: 'varchar', nullable: true })
  typeDisplay?: string;

  @ManyToOne(() => MasterWaybill)
  @JoinColumn({ name: 'master_waybill_id' })
  masterWaybill!: MasterWaybill;

  @Column({ name: 'master_waybill_id', type: 'varchar' })
  masterWaybillId!: string;

  @Column({ name: 'related_node', type: 'varchar', nullable: true })
  relatedNode?: string;

  @Column({ name: 'related_node_display', type: 'varchar', nullable: true })
  relatedNodeDisplay?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'author_id', type: 'varchar' })
  authorId!: string;

  @Column({ name: 'author_name', type: 'varchar' })
  authorName!: string;

  @Column({ name: 'author_role', type: 'varchar' })
  authorRole!: string;

  @Column({ name: 'author_role_display', type: 'varchar', nullable: true })
  authorRoleDisplay?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'rich_content', type: 'text', nullable: true })
  richContent?: string;

  @Column({ type: 'simple-enum', enum: ApprovalResult, nullable: true })
  approvalResult?: ApprovalResult;

  @Column({ name: 'approval_result_display', type: 'varchar', nullable: true })
  approvalResultDisplay?: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason?: string;

  @Column({ name: 'parent_comment_id', type: 'varchar', nullable: true })
  parentCommentId?: string;

  @Column({ name: 'mention_user_ids', type: 'text', nullable: true })
  mentionUserIds?: string;

  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal!: boolean;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'is_visible_on_timeline', type: 'boolean', default: true })
  isVisibleOnTimeline!: boolean;

  @Column({ name: 'has_attachments', type: 'boolean', default: false })
  hasAttachments!: boolean;

  @OneToMany(() => Attachment, (attachment) => attachment.comment)
  attachments!: Attachment[];

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;
}
