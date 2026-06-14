import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Company } from './Company';
import { Resume } from './Resume';
import { CommunityPost } from './CommunityPost';
import { PostComment } from './PostComment';
import { InterviewSchedule } from './InterviewSchedule';

export type UserRole = 'enterprise' | 'jobseeker' | 'admin';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'text',
    default: 'jobseeker'
  })
  role: UserRole;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Company, company => company.user)
  companies: Company[];

  @OneToMany(() => Resume, resume => resume.user)
  resumes: Resume[];

  @OneToMany(() => CommunityPost, post => post.user)
  posts: CommunityPost[];

  @OneToMany(() => PostComment, comment => comment.user)
  comments: PostComment[];

  @OneToMany(() => InterviewSchedule, schedule => schedule.jobseeker)
  interviews: InterviewSchedule[];
}
