import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Expert } from './Expert.js';
import { Dispute } from './Dispute.js';

export enum AssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated',
}

export enum AssignmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('expert_assignments')
export class ExpertAssignment extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  assignmentNumber: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({
    type: 'enum',
    enum: AssignmentPriority,
    default: AssignmentPriority.MEDIUM,
  })
  priority: AssignmentPriority;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  requiredSpecialties: string[] | null;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  expertReport: string | null;

  @Column({ type: 'jsonb', nullable: true })
  expertFindings: {
    diagnosis: string;
    causeAnalysis: string;
    recommendations: string[];
    estimatedDamage: number | null;
    confidenceLevel: number;
  } | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  ratingComment: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  assignmentScores: {
    matchScore: number;
    distanceScore: number;
    availabilityScore: number;
    workloadScore: number;
    totalScore: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  expertId: string | null;

  @ManyToOne(() => Expert, (expert) => expert.assignments, { nullable: true })
  expert: Expert | null;

  @Column({ type: 'uuid', nullable: true })
  disputeId: string | null;

  @ManyToOne(() => Dispute, (dispute) => dispute.expertAssignments, { nullable: true })
  dispute: Dispute | null;
}
