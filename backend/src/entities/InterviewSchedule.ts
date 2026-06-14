import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Job } from './Job';
import { User } from './User';
import { Company } from './Company';

@Entity()
export class InterviewSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: number;

  @Column()
  jobseekerId: number;

  @Column()
  companyId: number;

  @Column({ type: 'datetime' })
  interviewTime: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  interviewer: string;

  @Column({ default: 'scheduled' })
  status: string;

  @Column({ default: false })
  calendarSynced: boolean;

  @Column({ type: 'text', nullable: true })
  icsData: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Job, job => job.interviews)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => User, user => user.interviews)
  @JoinColumn({ name: 'jobseekerId' })
  jobseeker: User;

  @ManyToOne(() => Company, company => company.interviews)
  @JoinColumn({ name: 'companyId' })
  company: Company;
}
