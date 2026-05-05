import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatGroup } from './chat-group.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sender_id', comment: '发送人ID' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'receiver_id', nullable: true, comment: '接收人ID(私聊时)' })
  receiverId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ name: 'group_id', nullable: true, comment: '群组ID(群聊时)' })
  groupId: string;

  @ManyToOne(() => ChatGroup, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: ChatGroup;

  @Column({ type: 'varchar', default: MessageType.TEXT, comment: '消息类型' })
  type: MessageType;

  @Column({ type: 'text', comment: '消息内容' })
  content: string;

  @Column({ name: 'file_url', nullable: true, comment: '文件URL' })
  fileUrl: string;

  @Column({ name: 'file_name', nullable: true, comment: '文件名' })
  fileName: string;

  @Column({ name: 'file_size', nullable: true, comment: '文件大小(字节)' })
  fileSize: number;

  @Column({ name: 'is_read', default: false, comment: '是否已读' })
  isRead: boolean;

  @Column({ name: 'is_archived', default: false, comment: '是否已归档' })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
