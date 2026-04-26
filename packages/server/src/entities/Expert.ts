import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { User } from './User.js';
import { ExpertAssignment } from './ExpertAssignment.js';

export enum ExpertStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ON_LEAVE = 'on_leave',
  RETIRED = 'retired',
}

export enum ExpertCertificationLevel {
  JUNIOR = 'junior',
  INTERMEDIATE = 'intermediate',
  SENIOR = 'senior',
  CHIEF = 'chief',
}

@Entity('experts')
export class Expert extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'jsonb', nullable: true })
  specialties: string[] | null;

  @Column({
    type: 'enum',
    enum: ExpertCertificationLevel,
    default: ExpertCertificationLevel.JUNIOR,
  })
  certificationLevel: ExpertCertificationLevel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certificationNumber: string | null;

  @Column({ type: 'date', nullable: true })
  certificationExpiryDate: string | null;

  @Column({ type: 'jsonb', nullable: true })
  regions: string[] | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  baseLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  baseLongitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 50 })
  maxServiceRadiusKm: number;

  @Column({
    type: 'enum',
    enum: ExpertStatus,
    default: ExpertStatus.ACTIVE,
  })
  status: ExpertStatus;

  @Column({ type: 'integer', default: 0 })
  totalAssignments: number;

  @Column({ type: 'integer', default: 0 })
  completedAssignments: number;

  @Column({ type: 'integer', default: 0 })
  pendingAssignments: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'integer', default: 0 })
  ratingCount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    workDays: number[];
    startTime: string;
    endTime: string;
    exceptions: Array<{
      date: string;
      reason: string;
    }> | null;
  } | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.expertProfiles, { nullable: true })
  user: User | null;

  @OneToMany(() => ExpertAssignment, (assignment) => assignment.expert)
  assignments: ExpertAssignment[];

  calculateScore(): number {
    const levelScoreMap: Record<ExpertCertificationLevel, number> = {
      [ExpertCertificationLevel.JUNIOR]: 20,
      [ExpertCertificationLevel.INTERMEDIATE]: 40,
      [ExpertCertificationLevel.SENIOR]: 70,
      [ExpertCertificationLevel.CHIEF]: 100,
    };

    let score = levelScoreMap[this.certificationLevel] || 0;
    
    if (this.totalAssignments > 0) {
      const completionRate = this.completedAssignments / this.totalAssignments;
      score += completionRate * 20;
    }

    score += this.averageRating * 10;

    if (this.status !== ExpertStatus.ACTIVE) {
      score *= 0.5;
    }

    this.score = score;
    return score;
  }

  isAvailableAt(date: Date): boolean {
    if (this.status !== ExpertStatus.ACTIVE) {
      return false;
    }

    if (!this.availability) {
      return true;
    }

    const dayOfWeek = date.getDay();
    if (!this.availability.workDays.includes(dayOfWeek)) {
      return false;
    }

    if (this.availability.exceptions) {
      const dateStr = date.toISOString().split('T')[0];
      const hasException = this.availability.exceptions.some(ex => ex.date === dateStr);
      if (hasException) {
        return false;
      }
    }

    return true;
  }
}
