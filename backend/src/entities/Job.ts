import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  INTERNSHIP = 'internship',
  REMOTE = 'remote'
}

export enum JobStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  DRAFT = 'draft'
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  companyName: string;

  @Column({ nullable: true })
  companyLogo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'text', nullable: true })
  benefits: string;

  @Column({
    type: 'enum',
    enum: JobType,
    default: JobType.FULL_TIME
  })
  type: JobType;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  salaryRange: string;

  @Column({ nullable: true })
  experienceLevel: string;

  @Column({ nullable: true })
  educationLevel: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.ACTIVE
  })
  status: JobStatus;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  applicationCount: number;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('employment_guides')
export class EmploymentGuide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  cover: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
