import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from '../../contents/entities/content.entity';
import { ContentVersion } from '../../contents/entities/content-version.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewType, ReviewStatus, WorkflowStatus } from '../../common/enums';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => ContentVersion, { nullable: true })
  @JoinColumn({ name: 'content_version_id' })
  contentVersion: ContentVersion;

  @Column({ name: 'content_version_id', nullable: true })
  contentVersionId: string;

  @Column({
    name: 'review_type',
    type: 'varchar',
    length: 50,
  })
  reviewType: ReviewType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewer_id' })
  reviewerId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'diff_data', type: 'simple-json', nullable: true })
  diffData: any;

  @Column({ type: 'simple-json', nullable: true })
  annotations: any;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

  @Column({ name: 'workflow_type', length: 100, default: 'THREE_REVIEW_THREE_PROOF' })
  workflowType: string;

  @Column({ name: 'current_step', default: 1 })
  currentStep: number;

  @Column({ name: 'total_steps', default: 6 })
  totalSteps: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: WorkflowStatus.PENDING,
  })
  status: WorkflowStatus;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WorkflowInstance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_instance_id' })
  workflowInstance: WorkflowInstance;

  @Column({ name: 'workflow_instance_id' })
  workflowInstanceId: string;

  @Column({ name: 'step_number' })
  stepNumber: number;

  @Column({ name: 'step_name', length: 100 })
  stepName: string;

  @Column({
    name: 'step_type',
    type: 'varchar',
    length: 50,
  })
  stepType: ReviewType;

  @Column({ name: 'assigned_role', type: 'varchar', length: 50, nullable: true })
  assignedRole: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @ManyToOne(() => Review, { nullable: true })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Column({ name: 'review_id', nullable: true })
  reviewId: string;
}
