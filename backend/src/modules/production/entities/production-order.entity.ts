import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductionOrderStatus } from '../../../common/enums/production-status.enum';
import { User } from '../../users/entities/user.entity';
import { Style } from '../../styles/entities/style.entity';
import { Bom } from '../../boms/entities/bom.entity';
import { ProductionProgress } from './production-progress.entity';
import { ProductionIssue } from './production-issue.entity';

@Entity('production_orders')
export class ProductionOrder extends BaseEntity {
  @Column({ name: 'po_number', unique: true })
  poNumber: string;

  @Column({ name: 'style_id', type: 'uuid' })
  styleId: string;

  @ManyToOne(() => Style, (style) => style.productionOrders)
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ name: 'bom_id', type: 'uuid', nullable: true })
  bomId: string;

  @ManyToOne(() => Bom)
  @JoinColumn({ name: 'bom_id' })
  bom: Bom;

  @Column({ name: 'factory_id', type: 'uuid', nullable: true })
  factoryId: string;

  @ManyToOne(() => User, (user) => user.productionOrders)
  @JoinColumn({ name: 'factory_id' })
  factory: User;

  @Column({
    type: 'enum',
    enum: ProductionOrderStatus,
    default: ProductionOrderStatus.DRAFT,
  })
  status: ProductionOrderStatus;

  @Column({ name: 'order_quantity', type: 'int', default: 0 })
  orderQuantity: number;

  @Column({ name: 'sizes_breakdown', type: 'jsonb', nullable: true })
  sizesBreakdown: SizeBreakdown[];

  @Column({ name: 'scheduled_start_date', type: 'timestamp', nullable: true })
  scheduledStartDate: Date;

  @Column({ name: 'scheduled_end_date', type: 'timestamp', nullable: true })
  scheduledEndDate: Date;

  @Column({ name: 'actual_start_date', type: 'timestamp', nullable: true })
  actualStartDate: Date;

  @Column({ name: 'actual_end_date', type: 'timestamp', nullable: true })
  actualEndDate: Date;

  @Column({ name: 'delivery_date', type: 'timestamp', nullable: true })
  deliveryDate: Date;

  @Column({ name: 'production_line', nullable: true })
  productionLine: string;

  @Column({ name: 'workshop', nullable: true })
  workshop: string;

  @Column({ name: 'daily_production_target', type: 'int', nullable: true })
  dailyProductionTarget: number;

  @Column({ name: 'quantity_produced', type: 'int', default: 0 })
  quantityProduced: number;

  @Column({ name: 'quantity_quality_passed', type: 'int', default: 0 })
  quantityQualityPassed: number;

  @Column({ name: 'quantity_rejected', type: 'int', default: 0 })
  quantityRejected: number;

  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'currency', default: 'CNY' })
  currency: string;

  @Column({ name: 'is_urgent', default: false })
  isUrgent: boolean;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy: string;

  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ name: 'shipping_method', nullable: true })
  shippingMethod: string;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ name: 'custom_attributes', type: 'jsonb', nullable: true })
  customAttributes: { [key: string]: any };

  @OneToMany(() => ProductionProgress, (progress) => progress.productionOrder)
  progresses: ProductionProgress[];

  @OneToMany(() => ProductionIssue, (issue) => issue.productionOrder)
  issues: ProductionIssue[];
}

interface SizeBreakdown {
  size: string;
  quantity: number;
}
