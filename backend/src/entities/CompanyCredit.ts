import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './Company';

@Entity()
export class CompanyCredit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column({ type: 'decimal', nullable: true })
  complianceScore: number;

  @Column({ type: 'decimal', nullable: true })
  socialSecurityRate: number;

  @Column({ type: 'decimal', nullable: true })
  turnoverRate: number;

  @Column({ type: 'decimal', nullable: true })
  salaryOnTimeRate: number;

  @Column({ type: 'decimal', nullable: true })
  overtimeCompliance: number;

  @Column({ type: 'decimal', nullable: true })
  overallRating: number;

  @Column({ nullable: true })
  evaluationPeriod: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Company, company => company.credits)
  @JoinColumn({ name: 'companyId' })
  company: Company;
}
