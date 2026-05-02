import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  CANCEL = 'cancel',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  EXPORT = 'export',
  IMPORT = 'import',
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
  CORRECT = 'correct',
  REOPEN = 'reopen',
  REASSIGN = 'reassign',
}

export enum AuditLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ type: 'simple-enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ name: 'action_display', type: 'varchar', nullable: true })
  actionDisplay?: string;

  @Column({ type: 'simple-enum', enum: AuditLevel, default: AuditLevel.MEDIUM })
  level!: AuditLevel;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'varchar' })
  entityId!: string;

  @Column({ name: 'entity_no', type: 'varchar', nullable: true })
  entityNo?: string;

  @Column({ name: 'operator_id', type: 'varchar' })
  operatorId!: string;

  @Column({ name: 'operator_name', type: 'varchar' })
  operatorName!: string;

  @Column({ name: 'operator_role', type: 'varchar' })
  operatorRole!: string;

  @Column({ name: 'operator_ip', type: 'varchar', nullable: true })
  operatorIp?: string;

  @Column({ name: 'operator_user_agent', type: 'varchar', nullable: true })
  operatorUserAgent?: string;

  @Column({ name: 'original_value', type: 'text', nullable: true })
  originalValue?: string;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string;

  @Column({ name: 'changed_fields', type: 'text', nullable: true })
  changedFields?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'related_entity_type', type: 'varchar', nullable: true })
  relatedEntityType?: string;

  @Column({ name: 'related_entity_id', type: 'varchar', nullable: true })
  relatedEntityId?: string;

  @Column({ name: 'request_method', type: 'varchar', nullable: true })
  requestMethod?: string;

  @Column({ name: 'request_path', type: 'varchar', nullable: true })
  requestPath?: string;

  @Column({ name: 'request_id', type: 'varchar', nullable: true })
  requestId?: string;

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId?: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'read_by', type: 'varchar', nullable: true })
  readBy?: string;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt?: Date;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @Column({ name: 'metadata', type: 'text', nullable: true })
  metadata?: string;
}
