import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export enum SnapshotType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  REAL_TIME = 'real_time',
}

export enum SnapshotScope {
  GLOBAL = 'global',
  AIRLINE = 'airline',
  FORWARDER = 'forwarder',
  WAREHOUSE = 'warehouse',
  ROUTE = 'route',
}

@Entity('statistics_snapshots')
export class StatisticsSnapshot extends BaseEntity {
  @Column({ type: 'simple-enum', enum: SnapshotType })
  type!: SnapshotType;

  @Column({ type: 'simple-enum', enum: SnapshotScope, default: SnapshotScope.GLOBAL })
  scope!: SnapshotScope;

  @Column({ name: 'scope_value', type: 'varchar', nullable: true })
  scopeValue?: string;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate!: Date;

  @Column({ name: 'snapshot_time', type: 'datetime' })
  snapshotTime!: Date;

  @Column({ name: 'total_waybills', type: 'integer', default: 0 })
  totalWaybills!: number;

  @Column({ name: 'total_pieces', type: 'integer', default: 0 })
  totalPieces!: number;

  @Column({ name: 'total_weight', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalWeight!: number;

  @Column({ name: 'total_volume', type: 'decimal', precision: 15, scale: 3, default: 0 })
  totalVolume!: number;

  @Column({ name: 'pending_count', type: 'integer', default: 0 })
  pendingCount!: number;

  @Column({ name: 'booking_count', type: 'integer', default: 0 })
  bookingCount!: number;

  @Column({ name: 'receiving_count', type: 'integer', default: 0 })
  receivingCount!: number;

  @Column({ name: 'security_count', type: 'integer', default: 0 })
  securityCount!: number;

  @Column({ name: 'security_passed_count', type: 'integer', default: 0 })
  securityPassedCount!: number;

  @Column({ name: 'security_rejected_count', type: 'integer', default: 0 })
  securityRejectedCount!: number;

  @Column({ name: 'loading_count', type: 'integer', default: 0 })
  loadingCount!: number;

  @Column({ name: 'in_transit_count', type: 'integer', default: 0 })
  inTransitCount!: number;

  @Column({ name: 'arrived_count', type: 'integer', default: 0 })
  arrivedCount!: number;

  @Column({ name: 'pickup_count', type: 'integer', default: 0 })
  pickupCount!: number;

  @Column({ name: 'completed_count', type: 'integer', default: 0 })
  completedCount!: number;

  @Column({ name: 'cancelled_count', type: 'integer', default: 0 })
  cancelledCount!: number;

  @Column({ name: 'exception_count', type: 'integer', default: 0 })
  exceptionCount!: number;

  @Column({ name: 'overdue_count', type: 'integer', default: 0 })
  overdueCount!: number;

  @Column({ name: 'today_new_count', type: 'integer', default: 0 })
  todayNewCount!: number;

  @Column({ name: 'today_completed_count', type: 'integer', default: 0 })
  todayCompletedCount!: number;

  @Column({ name: 'today_exception_count', type: 'integer', default: 0 })
  todayExceptionCount!: number;

  @Column({ name: 'avg_processing_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgProcessingHours?: number;

  @Column({ name: 'avg_receiving_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgReceivingHours?: number;

  @Column({ name: 'avg_security_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgSecurityHours?: number;

  @Column({ name: 'avg_transit_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgTransitHours?: number;

  @Column({ name: 'on_time_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  onTimeRate?: number;

  @Column({ name: 'security_pass_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  securityPassRate?: number;

  @Column({ name: 'completion_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  completionRate?: number;

  @Column({ name: 'capacity_utilization_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  capacityUtilizationRate?: number;

  @Column({ name: 'space_available_weight', type: 'decimal', precision: 15, scale: 2, default: 0 })
  spaceAvailableWeight!: number;

  @Column({ name: 'space_locked_weight', type: 'decimal', precision: 15, scale: 2, default: 0 })
  spaceLockedWeight!: number;

  @Column({ name: 'space_occupied_weight', type: 'decimal', precision: 15, scale: 2, default: 0 })
  spaceOccupiedWeight!: number;

  @Column({ name: 'todo_total_count', type: 'integer', default: 0 })
  todoTotalCount!: number;

  @Column({ name: 'todo_pending_count', type: 'integer', default: 0 })
  todoPendingCount!: number;

  @Column({ name: 'todo_overdue_count', type: 'integer', default: 0 })
  todoOverdueCount!: number;

  @Column({ name: 'notification_unread_count', type: 'integer', default: 0 })
  notificationUnreadCount!: number;

  @Column({ name: 'airline_code', type: 'varchar', nullable: true })
  airlineCode?: string;

  @Column({ name: 'origin_airport', type: 'varchar', nullable: true })
  originAirport?: string;

  @Column({ name: 'destination_airport', type: 'varchar', nullable: true })
  destinationAirport?: string;

  @Column({ name: 'goods_type', type: 'varchar', nullable: true })
  goodsType?: string;

  @Column({ name: 'priority', type: 'varchar', nullable: true })
  priority?: string;

  @Column({ name: 'detail_data', type: 'text', nullable: true })
  detailData?: string;

  @Column({ name: 'trend_data', type: 'text', nullable: true })
  trendData?: string;

  @Column({ name: 'comparison_data', type: 'text', nullable: true })
  comparisonData?: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @Column({ name: 'is_latest', type: 'boolean', default: false })
  isLatest!: boolean;

  @Column({ name: 'version', type: 'integer', default: 1 })
  version!: number;
}
