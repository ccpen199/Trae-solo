import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

export enum NotificationType {
  POINTS_EARNED = 'points_earned',
  POINTS_SPENT = 'points_spent',
  POINTS_EXPIRY_SOON = 'points_expiry_soon',
  POINTS_EXPIRED = 'points_expired',
  EXCHANGE_SUCCESS = 'exchange_success',
  EXCHANGE_FAILED = 'exchange_failed',
  SYSTEM_NOTICE = 'system_notice',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  SMS = 'sms',
  EMAIL = 'email',
  WECHAT = 'wechat',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  notificationNo: string

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
  })
  type: NotificationType

  @Column({
    type: 'simple-enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel

  @Column({
    type: 'simple-enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus

  @Column()
  recipientId: string

  @Column()
  title: string

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, any>

  @Column({ nullable: true })
  templateId: string

  @Column({ type: 'simple-json', nullable: true })
  templateParams: Record<string, any>

  @Column({ nullable: true })
  sentAt: Date

  @Column({ nullable: true })
  readAt: Date

  @Column({ nullable: true, type: 'text' })
  failureReason: string

  @Column({ nullable: true })
  retryCount: number

  @Column({ nullable: true })
  nextRetryAt: Date

  @CreateDateColumn()
  createdAt: Date
}
