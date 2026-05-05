import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Message } from './message.entity';

@Entity('chat_groups')
export class ChatGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '群组编码' })
  code: string;

  @Column({ comment: '群组名称' })
  name: string;

  @Column({ nullable: true, comment: '群组描述' })
  description: string;

  @Column({ nullable: true, comment: '群组头像' })
  avatar: string;

  @Column({ name: 'owner_id', comment: '群主ID' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'chat_group_members',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @OneToMany(() => Message, (message) => message.group)
  messages: Message[];

  @Column({ name: 'max_members', default: 500, comment: '最大成员数' })
  maxMembers: number;

  @Column({ name: 'is_public', default: false, comment: '是否公开群组' })
  isPublic: boolean;

  @Column({ default: true, comment: '是否启用' })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
