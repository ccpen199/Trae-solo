import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum AuditResourceType {
  CROP = 'crop',
  GROWTH_STAGE = 'growth_stage',
  THRESHOLD = 'threshold',
  SENSOR = 'sensor',
  SENSOR_READING = 'sensor_reading',
  ALARM = 'alarm',
  CONTROL_DEVICE = 'control_device',
  CONTROL_COMMAND = 'control_command',
  FARMING_RECORD = 'farming_record',
  HIGH_YIELD_ANALYSIS = 'high_yield_analysis',
  STANDARDIZED_MODEL = 'standardized_model',
  USER = 'user',
  SETTINGS = 'settings',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
}

@Entity('audit_logs')
@Index(['resourceType', 'resourceId'])
@Index(['action', 'actionedAt'])
@Index(['operatorId', 'actionedAt'])
export class AuditLog extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
  })
  action: AuditAction;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'resource_type',
  })
  resourceType: AuditResourceType;

  @Column({ type: 'varchar', length: 36, nullable: true, name: 'resource_id' })
  resourceId: string;

  @Column({ type: 'varchar', length: 200, name: 'resource_name' })
  resourceName: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AuditResult.SUCCESS,
  })
  result: AuditResult;

  @Column({ type: 'datetime', name: 'actioned_at' })
  actionedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'operator_id' })
  operatorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'operator_name' })
  operatorName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'operator_role' })
  operatorRole: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'client_ip' })
  clientIp: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'module' })
  module: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'simple-json', nullable: true, name: 'old_value' })
  oldValue: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'new_value' })
  newValue: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'changes' })
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'related_alarm_id' })
  relatedAlarmId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'related_command_id' })
  relatedCommandId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'related_record_id' })
  relatedRecordId: string;
}
