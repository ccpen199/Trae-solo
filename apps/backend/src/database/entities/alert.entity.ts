import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { AlertType, AlertSeverity, AlertStatus, NotificationChannel } from '@iot/shared';

@Entity('alerts')
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity, default: AlertSeverity.WARNING })
  severity: AlertSeverity;

  @Index()
  @Column({ nullable: true })
  deviceId: string;

  @Index()
  @Column()
  homeId: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.OPEN })
  status: AlertStatus;

  @Column({ type: 'jsonb', default: [NotificationChannel.IN_APP, NotificationChannel.PUSH] })
  channels: NotificationChannel[];

  @Column({ type: 'jsonb', nullable: true })
  notifications: {
    channel: NotificationChannel;
    sentAt: Date;
    success: boolean;
    error?: string;
  }[];

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
