import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('telemetry')
@Index(['deviceId', 'timestamp'])
export class TelemetryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  deviceId: string;

  @Index()
  @Column()
  vendorId: string;

  @Index()
  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb' })
  properties: Record<string, any>;

  @Column({ type: 'float', nullable: true })
  powerConsumption: number;

  @Column({ type: 'float', nullable: true })
  signalStrength: number;

  @Column({ type: 'float', nullable: true })
  temperature: number;

  @Column({ type: 'float', nullable: true })
  humidity: number;

  @Column({ type: 'float', nullable: true })
  battery: number;
}

@Entity('device_commands')
@Index(['deviceId', 'createdAt'])
export class DeviceCommandEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  deviceId: string;

  @Index()
  @Column({ unique: true })
  requestId: string;

  @Column()
  command: string;

  @Column({ type: 'jsonb', default: {} })
  params: Record<string, any>;

  @Column()
  issuedBy: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'int', default: 5000 })
  timeoutMs: number;

  @Column({ default: false })
  isDelivered: boolean;

  @Column({ default: false })
  isExecuted: boolean;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('schedule_tasks')
export class ScheduleTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @Column()
  homeId: string;

  @Index()
  @Column({ nullable: true })
  deviceId: string;

  @Column({ type: 'jsonb' })
  commands: Record<string, any>;

  @Column({ length: 20 })
  triggerType: 'once' | 'daily' | 'weekly' | 'cron';

  @Column({ type: 'timestamp', nullable: true })
  triggerAt: Date;

  @Column({ nullable: true })
  cronExpression: string;

  @Column({ type: 'jsonb', nullable: true })
  weekdays: number[];

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('user_behavior_logs')
@Index(['userId', 'action', 'createdAt'])
export class UserBehaviorLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column({ nullable: true })
  homeId: string;

  @Index()
  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  sceneId: string;

  @Column({ length: 50 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
