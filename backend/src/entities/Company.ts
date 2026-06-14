import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Job } from './Job';
import { CompanyCredit } from './CompanyCredit';
import { InterviewSchedule } from './InterviewSchedule';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  companyName: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  scale: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  licenseNo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  certifications: Record<string, unknown>;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.companies)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Job, job => job.company)
  jobs: Job[];

  @OneToMany(() => CompanyCredit, credit => credit.company)
  credits: CompanyCredit[];

  @OneToMany(() => InterviewSchedule, schedule => schedule.company)
  interviews: InterviewSchedule[];
}
