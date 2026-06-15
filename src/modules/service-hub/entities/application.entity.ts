import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceItem } from './service-item.entity';
import { ServiceSubitem } from './service-subitem.entity';
import { ApplicationMaterial } from './application-material.entity';
import { ApplicationProgress } from './application-progress.entity';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'revoked';

export interface ApplicantInfo {
  userId?: string;
  name: string;
  idCard?: string;
  phone?: string;
  email?: string;
  address?: string;
  companyName?: string;
  creditCode?: string;
  legalPerson?: string;
  legalPersonIdCard?: string;
  contactName?: string;
  contactPhone?: string;
  userType?: 'natural' | 'legal';
}

export interface ScenarioPathItem {
  nodeId: string;
  question: string;
  answerKey: string;
  answerLabel: string;
}

@Entity('sh_application')
export class Application extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '申请人用户ID' })
  @Index('idx_app_user_id')
  userId: string;

  @Column({ name: 'item_id', type: 'uuid', comment: '事项ID' })
  @Index('idx_app_item_id')
  itemId: string;

  @Column({ name: 'subitem_id', type: 'uuid', nullable: true, comment: '子项ID' })
  @Index('idx_app_subitem_id')
  subitemId: string | null;

  @Column({ name: 'tracking_no', type: 'varchar', length: 50, unique: true, comment: '申报单号' })
  @Index('idx_app_tracking_no', { unique: true })
  trackingNo: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'draft',
    comment: '状态:draft-草稿 submitted-已提交 accepted-已受理 reviewing-审核中 approved-审核通过 rejected-审核驳回 completed-已办结 revoked-已撤销',
  })
  @Index('idx_app_status')
  status: ApplicationStatus;

  @Column({ name: 'scenario_path', type: 'jsonb', nullable: true, comment: '情形引导路径(JSON数组)' })
  scenarioPath: ScenarioPathItem[] | null;

  @Column({ name: 'applicant_info', type: 'jsonb', comment: '申请人信息(JSON)' })
  applicantInfo: ApplicantInfo;

  @Column({ name: 'form_data', type: 'jsonb', nullable: true, comment: '申报表单数据(JSON)' })
  formData: Record<string, unknown> | null;

  @Column({ name: 'submit_time', type: 'timestamp', nullable: true, comment: '提交时间' })
  submitTime: Date | null;

  @Column({ name: 'accept_time', type: 'timestamp', nullable: true, comment: '受理时间' })
  acceptTime: Date | null;

  @Column({ name: 'complete_time', type: 'timestamp', nullable: true, comment: '办结时间' })
  completeTime: Date | null;

  @Column({ name: 'dept_code', type: 'varchar', length: 50, nullable: true, comment: '办理部门编码' })
  deptCode: string | null;

  @Column({ name: 'handler_id', type: 'uuid', nullable: true, comment: '办理人ID' })
  handlerId: string | null;

  @Column({ name: 'reject_reason', type: 'text', nullable: true, comment: '驳回原因' })
  rejectReason: string | null;

  @Column({ name: 'remark', type: 'text', nullable: true, comment: '备注' })
  remark: string | null;

  @ManyToOne(() => ServiceItem, (item) => item.applications)
  @JoinColumn({ name: 'item_id' })
  item: ServiceItem;

  @ManyToOne(() => ServiceSubitem, (subitem) => subitem.applications, { nullable: true })
  @JoinColumn({ name: 'subitem_id' })
  subitem: ServiceSubitem | null;

  @OneToMany(() => ApplicationMaterial, (material) => material.application)
  materials: ApplicationMaterial[];

  @OneToMany(() => ApplicationProgress, (progress) => progress.application)
  progresses: ApplicationProgress[];
}
