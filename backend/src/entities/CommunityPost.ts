import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { PostComment } from './PostComment';

@Entity()
export class CommunityPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @Column({ type: 'simple-json', nullable: true })
  images: string[];

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ default: 'published' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => PostComment, comment => comment.post)
  comments: PostComment[];
}
