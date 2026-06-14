import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from './Company';
import { InterviewSchedule } from './InterviewSchedule';
import { JobMatch } from './JobMatch';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'decimal', nullable: true })
  salaryMin: number;

  @Column({ type: 'decimal', nullable: true })
  salaryMax: number;

  @Column({ nullable: true })
  workLocation: string;

  @Column({ nullable: true })
  jobType: string;

  @Column({ type: 'simple-json', nullable: true })
  processRequirements: {
    printingMethod?: string;
    colorGroupRequirement?: string;
    precisionRequirement?: string;
    [key: string]: unknown;
  };

  @Column({ type: 'simple-json', nullable: true })
  equipmentModels: {
    heidelberg?: string[];
    komori?: string[];
    roland?: string[];
    other?: string[];
    [key: string]: unknown;
  };

  @Column({ type: 'simple-json', nullable: true })
  materialStandards: {
    paperType?: string;
    inkStandard?: string;
    laminationRequirement?: string;
    [key: string]: unknown;
  };

  @Column({ type: 'simple-json', nullable: true })
  requiredSkills: string[];

  @Column({ nullable: true })
  experienceYears: string;

  @Column({ nullable: true })
  education: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Company, company => company.jobs)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => InterviewSchedule, schedule => schedule.job)
  interviews: InterviewSchedule[];

  @OneToMany(() => JobMatch, match => match.job)
  matches: JobMatch[];
}
