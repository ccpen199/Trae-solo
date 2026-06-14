import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { CommunityPost } from './CommunityPost';

@Entity()
export class PostComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ nullable: true })
  parentId: number;

  @Column({ default: 'published' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => CommunityPost, post => post.comments)
  @JoinColumn({ name: 'postId' })
  post: CommunityPost;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'userId' })
  user: User;
}
