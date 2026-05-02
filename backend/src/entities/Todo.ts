import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { MasterWaybill } from './MasterWaybill';
import { User } from './User';

export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum TodoPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TodoSource {
  SYSTEM = 'system',
  MANUAL = 'manual',
  RULE_ENGINE = 'rule_engine',
  STATUS_FLOW = 'status_flow',
}

@Entity('todos')
export class Todo extends BaseEntity {
  @Column({ name: 'todo_no', type: 'varchar', unique: true })
  todoNo!: string;

  @Column({ type: 'simple-enum', enum: TodoStatus, default: TodoStatus.PENDING })
  status!: TodoStatus;

  @Column({ name: 'status_display', type: 'varchar', nullable: true })
  statusDisplay?: string;

  @Column({ type: 'simple-enum', enum: TodoPriority, default: TodoPriority.NORMAL })
  priority!: TodoPriority;

  @Column({ type: 'simple-enum', enum: TodoSource, default: TodoSource.SYSTEM })
  source!: TodoSource;

  @ManyToOne(() => MasterWaybill)
  @JoinColumn({ name: 'master_waybill_id' })
  masterWaybill!: MasterWaybill;

  @Column({ name: 'master_waybill_id', type: 'varchar' })
  masterWaybillId!: string;

  @Column({ name: 'related_node', type: 'varchar' })
  relatedNode!: string;

  @Column({ name: 'related_node_display', type: 'varchar', nullable: true })
  relatedNodeDisplay?: string;

  @Column({ name: 'related_action', type: 'varchar', nullable: true })
  relatedAction?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignee_id' })
  assignee!: User;

  @Column({ name: 'assignee_id', type: 'varchar' })
  assigneeId!: string;

  @Column({ name: 'assignee_name', type: 'varchar' })
  assigneeName!: string;

  @Column({ name: 'assignee_role', type: 'varchar' })
  assigneeRole!: string;

  @Column({ name: 'assignee_role_display', type: 'varchar', nullable: true })
  assigneeRoleDisplay?: string;

  @Column({ name: 'title', type: 'varchar' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'action_url', type: 'varchar', nullable: true })
  actionUrl?: string;

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ name: 'reminder_time', type: 'datetime', nullable: true })
  reminderTime?: Date;

  @Column({ name: 'is_reminded', type: 'boolean', default: false })
  isReminded!: boolean;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt?: Date;

  @Column({ name: 'started_by', type: 'varchar', nullable: true })
  startedBy?: string;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date;

  @Column({ name: 'completed_by', type: 'varchar', nullable: true })
  completedBy?: string;

  @Column({ name: 'completion_note', type: 'text', nullable: true })
  completionNote?: string;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancelled_by', type: 'varchar', nullable: true })
  cancelledBy?: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ name: 'parent_todo_id', type: 'varchar', nullable: true })
  parentTodoId?: string;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible!: boolean;

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;
}
