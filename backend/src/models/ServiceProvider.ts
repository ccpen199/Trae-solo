import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum ProviderStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
}

@Entity()
export class ServiceProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @Column({
    type: 'simple-enum',
    enum: ProviderStatus,
    default: ProviderStatus.PENDING_REVIEW,
  })
  status: ProviderStatus;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  businessLicense: string;

  @Column({ nullable: true })
  idCardFront: string;

  @Column({ nullable: true })
  idCardBack: string;

  @Column({ nullable: true })
  qualificationCertificate: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  reviewerId: number;

  @Column({ type: 'datetime', nullable: true })
  reviewTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingSettlement: number;

  @Column({ type: 'int', default: 7 })
  settlementPeriod: number;

  @Column({ type: 'simple-json', nullable: true })
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };

  @Column({ type: 'simple-json', nullable: true })
  serviceAreas: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
