import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar', length: 50,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt: Date;

  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType: string;

  @Column({ name: 'related_entity_id', type: 'uuid', nullable: true })
  relatedEntityId: string;

  @Column({ name: 'action_url', nullable: true })
  actionUrl: string;

  @Column({ name: 'action_text', nullable: true })
  actionText: string;

  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId: string;

  @Column({ name: 'sender_name', nullable: true })
  senderName: string;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date;

  @Column({ name: 'data', type: 'json', nullable: true })
  data: { [key: string]: any };

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags: string[];
}
