import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RiderEntity } from './Rider.entity.js';
import { AuditType, AuditLevel, AuditStatus } from '@shared/types';

@Entity('audit_flows')
@Index(['type', 'status', 'createdAt'])
@Index(['applicantId', 'type'])
export class AuditFlowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['real_name_auth', 'qualification_change', 'order_complaint', 'credit_appeal', 'frozen_appeal', 'vehicle_change'],
  })
  type: AuditType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid' })
  applicantId: string;

  @Column({
    type: 'enum',
    enum: ['rider', 'system', 'customer'],
    default: 'rider',
  })
  applicantType: 'rider' | 'system' | 'customer';

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: ['first', 'second', 'final'],
    default: 'first',
  })
  currentLevel: AuditLevel;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: AuditStatus;

  @Column({ type: 'jsonb', default: [] })
  auditLogs: {
    id: string;
    flowId: string;
    auditorId: string;
    auditorName: string;
    level: AuditLevel;
    decision: AuditStatus;
    remark?: string;
    previousStatus: AuditStatus;
    nextStatus: AuditStatus;
    createdAt: Date;
  }[];

  @Column({
    type: 'enum',
    enum: ['approved', 'rejected'],
    nullable: true,
  })
  finalDecision?: 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  finalRemark?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RiderEntity, (rider) => rider.auditFlows)
  @JoinColumn({ name: 'applicantId' })
  applicant: RiderEntity;
}
