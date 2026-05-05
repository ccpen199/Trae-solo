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
import { User } from '../../user/entities/user.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowInstance } from './workflow-instance.entity';

export enum WorkflowType {
  COMPLAINT = 'complaint',
  PRICE_DISCOUNT = 'price_discount',
  LEAVE = 'leave',
  PURCHASE = 'purchase',
  CUSTOM = 'custom',
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DISABLED = 'disabled',
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: '流程编码' })
  code: string;

  @Column({ comment: '流程名称' })
  name: string;

  @Column({ type: 'varchar', default: WorkflowType.CUSTOM, comment: '流程类型' })
  type: WorkflowType;

  @Column({ nullable: true, comment: '流程描述' })
  description: string;

  @Column({ type: 'varchar', default: WorkflowStatus.DRAFT, comment: '流程状态' })
  status: WorkflowStatus;

  @OneToMany(() => WorkflowStep, (step) => step.workflow, { cascade: true })
  steps: WorkflowStep[];

  @OneToMany(() => WorkflowInstance, (instance) => instance.workflow)
  instances: WorkflowInstance[];

  @Column({ name: 'creator_id', comment: '创建人ID' })
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
