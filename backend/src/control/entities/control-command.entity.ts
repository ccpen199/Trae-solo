import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ControlDevice } from './control-device.entity';
import { FarmingRecord } from '../../traceability/entities/farming-record.entity';

export enum ControlCommandType {
  IRRIGATION = 'irrigation',
  ROLLER_CURTAIN = 'roller_curtain',
  VENTILATION = 'ventilation',
  HEATING = 'heating',
  HUMIDIFICATION = 'humidification',
  CO2_CONTROL = 'co2_control',
  LIGHTING = 'lighting',
}

export enum ControlCommandStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ControlSource {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  ALARM_TRIGGERED = 'alarm_triggered',
}

@Entity('control_commands')
export class ControlCommand extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    name: 'command_type',
  })
  commandType: ControlCommandType;

  @Column({
    type: 'varchar',
    length: 50,
    default: ControlCommandStatus.PENDING,
  })
  status: ControlCommandStatus;

  @Column({
    type: 'varchar',
    length: 50,
    default: ControlSource.MANUAL,
  })
  source: ControlSource;

  @Column({ type: 'float', name: 'target_value', nullable: true })
  targetValue: number;

  @Column({ type: 'float', nullable: true, name: 'duration_seconds' })
  durationSeconds: number;

  @Column({ type: 'float', nullable: true, name: 'flow_rate' })
  flowRate: number;

  @Column({ type: 'boolean', default: false, name: 'is_pid_controlled' })
  isPidControlled: boolean;

  @Column({ type: 'simple-json', nullable: true, name: 'pid_result' })
  pidResult: {
    targetValue: number;
    currentValue: number;
    kp: number;
    ki: number;
    kd: number;
    error: number;
    integralSum: number;
    derivative: number;
    output: number;
  };

  @Column({ type: 'datetime', name: 'scheduled_at', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'operator_id' })
  operatorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'operator_name' })
  operatorName: string;

  @Column({ type: 'text', nullable: true, name: 'reason' })
  reason: string;

  @Column({ type: 'text', nullable: true, name: 'execution_notes' })
  executionNotes: string;

  @Column({ type: 'simple-json', nullable: true, name: 'feedback_data' })
  feedbackData: Record<string, any>;

  @ManyToOne(() => ControlDevice, (device) => device.commands, { onDelete: 'CASCADE' })
  device: ControlDevice;

  @Column({ name: 'device_id' })
  deviceId: string;

  @ManyToOne(() => FarmingRecord, { nullable: true })
  farmingRecord: FarmingRecord;

  @Column({ name: 'farming_record_id', nullable: true })
  farmingRecordId: string;
}
