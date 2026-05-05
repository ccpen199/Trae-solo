import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { Role } from '../../role/entities/role.entity';
import { Organization } from '../../organization/entities/organization.entity';

export enum StepType {
  START = 'start',
  APPROVAL = 'approval',
  CONDITION = 'condition',
  END = 'end',
}

export enum ApprovalType {
  ANY = 'any',
  ALL = 'all',
}

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', comment: '流程ID' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.steps)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ comment: '步骤名称' })
  name: string;

  @Column({ type: 'varchar', comment: '步骤类型' })
  type: StepType;

  @Column({ name: 'sort_order', default: 0, comment: '步骤顺序' })
  sortOrder: number;

  @Column({ type: 'varchar', default: ApprovalType.ANY, comment: '审批方式' })
  approvalType: ApprovalType;

  @Column({ name: 'role_id', nullable: true, comment: '审批角色ID' })
  roleId: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'organization_id', nullable: true, comment: '审批组织ID' })
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'next_step_id', nullable: true, comment: '下一步骤ID' })
  nextStepId: string;

  @Column({ name: 'reject_step_id', nullable: true, comment: '驳回后步骤ID' })
  rejectStepId: string;

  @Column({ nullable: true, comment: '条件表达式' })
  condition: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
