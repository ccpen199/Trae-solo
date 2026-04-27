import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Alarm } from './alarm.entity';
import { ControlCommand } from '../../control/entities/control-command.entity';

export enum AlarmActionType {
  NOTIFICATION = 'notification',
  SUGGESTION = 'suggestion',
  AUTO_CONTROL = 'auto_control',
  MANUAL_CONFIRM = 'manual_confirm',
}

export enum AlarmActionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('alarm_actions')
export class AlarmAction extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    name: 'action_type',
  })
  actionType: AlarmActionType;

  @Column({
    type: 'varchar',
    length: 50,
    default: AlarmActionStatus.PENDING,
  })
  status: AlarmActionStatus;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'action_details' })
  actionDetails: string;

  @Column({ type: 'text', nullable: true, name: 'recommendation' })
  recommendation: string;

  @Column({ type: 'boolean', default: false, name: 'requires_confirmation' })
  requiresConfirmation: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_confirmed' })
  isConfirmed: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'confirmed_by' })
  confirmedBy: string;

  @Column({ type: 'datetime', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'executed_at' })
  executedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'execution_result' })
  executionResult: string;

  @Column({ type: 'simple-json', nullable: true, name: 'pid_params' })
  pidParams: {
    targetValue: number;
    kp: number;
    ki: number;
    kd: number;
    currentError: number;
    integralSum: number;
    derivativeTerm: number;
    output: number;
  };

  @ManyToOne(() => Alarm, (alarm) => alarm.actions, { onDelete: 'CASCADE' })
  alarm: Alarm;

  @Column({ name: 'alarm_id' })
  alarmId: string;

  @ManyToOne(() => ControlCommand, { nullable: true })
  controlCommand: ControlCommand;

  @Column({ name: 'control_command_id', nullable: true })
  controlCommandId: string;
}
