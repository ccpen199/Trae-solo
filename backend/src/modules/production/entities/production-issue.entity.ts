import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductionOrder } from './production-order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('production_issues')
export class ProductionIssue extends BaseEntity {
  @Column({ name: 'issue_number', unique: true })
  issueNumber: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId: string;

  @ManyToOne(() => ProductionOrder, (po) => po.issues)
  @JoinColumn({ name: 'production_order_id' })
  productionOrder: ProductionOrder;

  @Column({ name: 'reported_by', type: 'uuid', nullable: true })
  reportedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by' })
  reporter: User;

  @Column({ name: 'issue_type' })
  issueType: string;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'stage', nullable: true })
  stage: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause: string;

  @Column({ name: 'impact_analysis', type: 'text', nullable: true })
  impactAnalysis: string;

  @Column({ name: 'status', default: 'open' })
  status: string;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'reported_at', type: 'timestamp', nullable: true })
  reportedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: string;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ name: 'resolution', type: 'text', nullable: true })
  resolution: string;

  @Column({ name: 'preventive_measures', type: 'text', nullable: true })
  preventiveMeasures: string;

  @Column({ name: 'image_urls', type: 'jsonb', nullable: true })
  imageUrls: string[];

  @Column({ name: 'attachment_urls', type: 'jsonb', nullable: true })
  attachmentUrls: string[];

  @Column({ name: 'estimated_delay_hours', type: 'int', nullable: true })
  estimatedDelayHours: number;

  @Column({ name: 'actual_delay_hours', type: 'int', nullable: true })
  actualDelayHours: number;

  @Column({ name: 'cost_impact', type: 'decimal', precision: 12, scale: 2, nullable: true })
  costImpact: number;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ name: 'custom_attributes', type: 'jsonb', nullable: true })
  customAttributes: { [key: string]: any };
}
