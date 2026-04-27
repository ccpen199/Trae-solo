import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ControlCommand } from './control-command.entity';

export enum DeviceType {
  IRRIGATION_VALVE = 'irrigation_valve',
  ROLLER_CURTAIN = 'roller_curtain',
  VENTILATION_FAN = 'ventilation_fan',
  HEATER = 'heater',
  HUMIDIFIER = 'humidifier',
  CO2_GENERATOR = 'co2_generator',
  LIGHT_SYSTEM = 'light_system',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  RUNNING = 'running',
  IDLE = 'idle',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

@Entity('control_devices')
export class ControlDevice extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type: DeviceType;

  @Column({
    type: 'varchar',
    length: 50,
    default: DeviceStatus.OFFLINE,
  })
  status: DeviceStatus;

  @Column({ type: 'varchar', length: 50, name: 'location_zone' })
  locationZone: string;

  @Column({ type: 'float', nullable: true, name: 'current_value' })
  currentValue: number;

  @Column({ type: 'float', nullable: true, name: 'target_value' })
  targetValue: number;

  @Column({ type: 'float', nullable: true, name: 'max_capacity' })
  maxCapacity: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'unit' })
  unit: string;

  @Column({ type: 'simple-json', nullable: true, name: 'pid_config' })
  pidConfig: {
    kp: number;
    ki: number;
    kd: number;
    outputMin: number;
    outputMax: number;
    integralMax: number;
  };

  @Column({ type: 'simple-json', nullable: true, name: 'device_config' })
  deviceConfig: Record<string, any>;

  @Column({ type: 'datetime', nullable: true, name: 'last_operated_at' })
  lastOperatedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_operated_by' })
  lastOperatedBy: string;

  @OneToMany(() => ControlCommand, (command) => command.device)
  commands: ControlCommand[];
}
