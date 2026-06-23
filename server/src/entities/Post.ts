import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Community } from './Community';
import { Comment } from './Comment';

@Entity()
export class Post {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('text')
  communityId: string;

  @Column('text')
  content: string;

  @Column('simple-json', { nullable: true })
  images: string[];

  @Column('integer', { default: 0 })
  likeCount: number;

  @Column('text', { default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];
}
