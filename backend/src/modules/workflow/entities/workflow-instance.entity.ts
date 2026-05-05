import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { User } from '../../user/entities/user.entity';
import { WorkflowTask } from './workflow-task.entity';

export enum InstanceStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '实例编号' })
  instanceNo: string;

  @Column({ name: 'workflow_id', comment: '流程模板ID' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.instances)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ name: 'title', comment: '流程标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '表单数据(JSON)' })
  formData: string;

  @Column({ type: 'varchar', default: InstanceStatus.PENDING, comment: '实例状态' })
  status: InstanceStatus;

  @Column({ name: 'current_step_id', nullable: true, comment: '当前步骤ID' })
  currentStepId: string;

  @Column({ name: 'initiator_id', comment: '发起人ID' })
  initiatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'initiator_id' })
  initiator: User;

  @OneToMany(() => WorkflowTask, (task) => task.instance)
  tasks: WorkflowTask[];

  @Column({ name: 'received_at', nullable: true, comment: '收文时间' })
  receivedAt: Date;

  @Column({ name: 'completed_at', nullable: true, comment: '完成时间' })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
