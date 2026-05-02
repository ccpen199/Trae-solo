import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Style } from '../../styles/entities/style.entity';

@Entity('communications')
export class Communication extends BaseEntity {
  @Column({ name: 'message_number', unique: true })
  messageNumber: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, (user) => user.sentCommunications)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'receiver_id', type: 'uuid', nullable: true })
  receiverId: string;

  @ManyToOne(() => User, (user) => user.receivedCommunications)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ name: 'communication_type', default: 'message' })
  communicationType: string;

  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType: string;

  @Column({ name: 'related_entity_id', type: 'uuid', nullable: true })
  relatedEntityId: string;

  @Column({ name: 'related_style_id', type: 'uuid', nullable: true })
  relatedStyleId: string;

  @ManyToOne(() => Style, (style) => style.communications)
  @JoinColumn({ name: 'related_style_id' })
  relatedStyle: Style;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'content_type', default: 'text' })
  contentType: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt: Date;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string;

  @Column({ name: 'thread_id', type: 'uuid', nullable: true })
  threadId: string;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'category', nullable: true })
  category: string;

  @Column({ name: 'sub_category', nullable: true })
  subCategory: string;

  @Column({ name: 'status', default: 'sent' })
  status: string;

  @Column({ name: 'resolution', type: 'text', nullable: true })
  resolution: string;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ name: 'attachment_urls', type: 'json', nullable: true })
  attachmentUrls: string[];

  @Column({ name: 'image_urls', type: 'json', nullable: true })
  imageUrls: string[];

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags: string[];

  @Column({ name: 'custom_attributes', type: 'json', nullable: true })
  customAttributes: { [key: string]: any };
}
