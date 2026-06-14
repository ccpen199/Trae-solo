import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Job } from './Job';
import { Resume } from './Resume';

@Entity()
export class JobMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: number;

  @Column()
  resumeId: number;

  @Column({ type: 'decimal', nullable: true })
  similarityScore: number;

  @Column({ type: 'decimal', nullable: true })
  skillMatchScore: number;

  @Column({ type: 'decimal', nullable: true })
  experienceMatchScore: number;

  @CreateDateColumn()
  recommendedAt: Date;

  @Column({ default: 'pending' })
  status: string;

  @ManyToOne(() => Job, job => job.matches)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => Resume, resume => resume.matches)
  @JoinColumn({ name: 'resumeId' })
  resume: Resume;
}
