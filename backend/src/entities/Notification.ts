import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { User } from './User';

export enum NotificationType {
  SYSTEM = 'system',
  STATUS_CHANGE = 'status_change',
  TODO = 'todo',
  APPROVAL = 'approval',
  COMMENT = 'comment',
  REMINDER = 'reminder',
  EXCEPTION = 'exception',
  INFO = 'info',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  WECHAT = 'wechat',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ type: 'simple-enum', enum: NotificationType, default: NotificationType.SYSTEM })
  type!: NotificationType;

  @Column({ name: 'type_display', type: 'varchar', nullable: true })
  typeDisplay?: string;

  @Column({ type: 'simple-enum', enum: NotificationChannel, default: NotificationChannel.IN_APP })
  channel!: NotificationChannel;

  @Column({ type: 'simple-enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority!: NotificationPriority;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  recipient!: User;

  @Column({ name: 'recipient_id', type: 'varchar' })
  recipientId!: string;

  @Column({ name: 'recipient_name', type: 'varchar' })
  recipientName!: string;

  @Column({ name: 'recipient_role', type: 'varchar' })
  recipientRole!: string;

  @ManyToOne(() => MasterWaybill, { nullable: true })
  @JoinColumn({ name: 'master_waybill_id' })
  masterWaybill?: MasterWaybill;

  @Column({ name: 'master_waybill_id', type: 'varchar', nullable: true })
  masterWaybillId?: string;

  @Column({ name: 'related_entity_type', type: 'varchar', nullable: true })
  relatedEntityType?: string;

  @Column({ name: 'related_entity_id', type: 'varchar', nullable: true })
  relatedEntityId?: string;

  @Column({ name: 'title', type: 'varchar' })
  title!: string;

  @Column({ name: 'content', type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'short_content', type: 'varchar', nullable: true })
  shortContent?: string;

  @Column({ name: 'action_url', type: 'varchar', nullable: true })
  actionUrl?: string;

  @Column({ name: 'action_text', type: 'varchar', nullable: true })
  actionText?: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt?: Date;

  @Column({ name: 'read_by', type: 'varchar', nullable: true })
  readBy?: string;

  @Column({ name: 'is_clicked', type: 'boolean', default: false })
  isClicked!: boolean;

  @Column({ name: 'clicked_at', type: 'datetime', nullable: true })
  clickedAt?: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'scheduled_send_time', type: 'datetime', nullable: true })
  scheduledSendTime?: Date;

  @Column({ name: 'actual_send_time', type: 'datetime', nullable: true })
  actualSendTime?: Date;

  @Column({ name: 'send_status', type: 'varchar', default: 'pending' })
  sendStatus!: string;

  @Column({ name: 'send_error', type: 'text', nullable: true })
  sendError?: string;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ name: 'expire_at', type: 'datetime', nullable: true })
  expireAt?: Date;

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;
}
