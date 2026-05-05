import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowInstance } from './workflow-instance.entity';
import { User } from '../../user/entities/user.entity';
import { WorkflowStep } from './workflow-step.entity';

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  TRANSFERRED = 'transferred',
}

@Entity('workflow_tasks')
export class WorkflowTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '任务编号' })
  taskNo: string;

  @Column({ name: 'instance_id', comment: '流程实例ID' })
  instanceId: string;

  @ManyToOne(() => WorkflowInstance, (instance) => instance.tasks)
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  @Column({ name: 'step_id', comment: '步骤ID' })
  stepId: string;

  @ManyToOne(() => WorkflowStep)
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStep;

  @Column({ name: 'assignee_id', comment: '处理人ID' })
  assigneeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ type: 'varchar', default: TaskStatus.PENDING, comment: '任务状态' })
  status: TaskStatus;

  @Column({ type: 'text', nullable: true, comment: '处理意见' })
  comment: string;

  @Column({ name: 'received_at', nullable: true, comment: '收文时间' })
  receivedAt: Date;

  @Column({ name: 'handled_at', nullable: true, comment: '处理时间' })
  handledAt: Date;

  @Column({ name: 'handled_by', nullable: true, comment: '实际处理人ID' })
  handledBy: string;

  @Column({ name: 'is_read', default: false, comment: '是否已读' })
  isRead: boolean;

  @Column({ name: 'is_urged', default: false, comment: '是否被催办' })
  isUrged: boolean;

  @Column({ name: 'urged_count', default: 0, comment: '催办次数' })
  urgedCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
