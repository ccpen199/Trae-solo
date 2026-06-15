import { Entity, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Application } from './application.entity';

export type ProgressAction =
  | 'create'
  | 'submit'
  | 'accept'
  | 'review'
  | 'approve'
  | 'reject'
  | 'complete'
  | 'revoke'
  | 'supplement'
  | 'transfer'
  | 'notify';

@Entity('sh_application_progress')
export class ApplicationProgress extends BaseEntity {
  @Column({ name: 'application_id', type: 'uuid', comment: '申报单ID' })
  @Index('idx_prog_application_id')
  applicationId: string;

  @Column({ name: 'node_name', type: 'varchar', length: 100, comment: '节点名称' })
  nodeName: string;

  @Column({ name: 'node_code', type: 'varchar', length: 50, nullable: true, comment: '节点编码' })
  nodeCode: string | null;

  @Column({ name: 'operator_id', type: 'uuid', nullable: true, comment: '操作人ID' })
  operatorId: string | null;

  @Column({ name: 'operator', type: 'varchar', length: 100, nullable: true, comment: '操作人姓名' })
  operator: string | null;

  @Column({ name: 'operator_role', type: 'varchar', length: 50, nullable: true, comment: '操作人角色' })
  operatorRole: string | null;

  @Column({
    name: 'action',
    type: 'varchar',
    length: 20,
    comment: '操作类型:create-创建 submit-提交 accept-受理 review-审核 approve-通过 reject-驳回 complete-办结 revoke-撤销',
  })
  action: ProgressAction;

  @Column({ name: 'from_status', type: 'varchar', length: 20, nullable: true, comment: '变更前状态' })
  fromStatus: string | null;

  @Column({ name: 'to_status', type: 'varchar', length: 20, nullable: true, comment: '变更后状态' })
  toStatus: string | null;

  @Column({ name: 'remark', type: 'text', nullable: true, comment: '备注/意见' })
  remark: string | null;

  @Column({ name: 'attachments', type: 'jsonb', nullable: true, comment: '附件(JSON数组)' })
  attachments: Record<string, unknown>[] | null;

  @CreateDateColumn({
    name: 'create_time',
    type: 'timestamp',
    comment: '操作时间',
  })
  createTime: Date;

  @ManyToOne(() => Application, (application) => application.progresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}
