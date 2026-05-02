import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductionOrder } from './production-order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('production_progresses')
export class ProductionProgress extends BaseEntity {
  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId: string;

  @ManyToOne(() => ProductionOrder, (po) => po.progresses)
  @JoinColumn({ name: 'production_order_id' })
  productionOrder: ProductionOrder;

  @Column({ name: 'reported_by', type: 'uuid', nullable: true })
  reportedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by' })
  reporter: User;

  @Column({ name: 'stage' })
  stage: string;

  @Column({ name: 'stage_order', type: 'int', default: 0 })
  stageOrder: number;

  @Column({ name: 'status', default: 'in_progress' })
  status: string;

  @Column({ name: 'quantity_started', type: 'int', default: 0 })
  quantityStarted: number;

  @Column({ name: 'quantity_completed', type: 'int', default: 0 })
  quantityCompleted: number;

  @Column({ name: 'quantity_rejected', type: 'int', default: 0 })
  quantityRejected: number;

  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ name: 'estimated_completion_at', type: 'datetime', nullable: true })
  estimatedCompletionAt: Date;

  @Column({ name: 'workstation', nullable: true })
  workstation: string;

  @Column({ name: 'operator_name', nullable: true })
  operatorName: string;

  @Column({ name: 'daily_output', type: 'int', nullable: true })
  dailyOutput: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'image_urls', type: 'json', nullable: true })
  imageUrls: string[];

  @Column({ name: 'custom_attributes', type: 'json', nullable: true })
  customAttributes: { [key: string]: any };
}
