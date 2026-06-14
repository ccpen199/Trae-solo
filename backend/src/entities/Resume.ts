import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Portfolio } from './Portfolio';
import { JobMatch } from './JobMatch';

@Entity()
export class Resume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  education: string;

  @Column({ type: 'simple-json', nullable: true })
  workExperience: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    gravureExperienceYears?: number;
    offsetExperienceYears?: number;
    flexoExperienceYears?: number;
    description?: string;
    [key: string]: unknown;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  skills: Array<{
    name?: string;
    psPlateSoftwareProficiency?: number;
    ctpOperationProficiency?: number;
    colorManagementProficiency?: number;
    [key: string]: unknown;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  certifications: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    isoCertificationExperience?: string;
    [key: string]: unknown;
  }>;

  @Column({ type: 'decimal', nullable: true })
  expectedSalary: number;

  @Column({ nullable: true })
  expectedPosition: string;

  @Column({ type: 'simple-json', nullable: true })
  portfolio: Array<{
    title?: string;
    description?: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    [key: string]: unknown;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  aiParsedData: Record<string, unknown>;

  @Column({ type: 'decimal', nullable: true })
  parseScore: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.resumes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Portfolio, portfolio => portfolio.resume)
  portfolios: Portfolio[];

  @OneToMany(() => JobMatch, match => match.resume)
  matches: JobMatch[];
}
