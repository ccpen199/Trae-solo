import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceCategory } from './service-category.entity';
import { ServiceSubitem } from './service-subitem.entity';
import { ScenarioTree } from './scenario-tree.entity';
import { Application } from './application.entity';

export type ServiceType = 'administrative_license' | 'administrative_confirmation' | 'public_service' | 'administrative_penalty' | 'administrative_collection' | 'other';

export type HandlingMode = 'online' | 'offline' | 'hybrid';

export interface MaterialItem {
  name: string;
  code?: string;
  required: boolean;
  description?: string;
  certType?: string;
  format?: string;
  quantity?: number;
}

@Entity('sh_service_item')
export class ServiceItem extends BaseEntity {
  @Column({ name: 'title', type: 'varchar', length: 200, comment: '事项名称' })
  title: string;

  @Column({ name: 'code', type: 'varchar', length: 50, unique: true, comment: '事项编码' })
  @Index('idx_item_code', { unique: true })
  code: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true, comment: '所属分类ID' })
  @Index('idx_item_category_id')
  categoryId: string | null;

  @Column({ name: 'dept_code', type: 'varchar', length: 50, nullable: true, comment: '所属委办局编码' })
  @Index('idx_item_dept_code')
  deptCode: string | null;

  @Column({
    name: 'service_type',
    type: 'varchar',
    length: 30,
    default: 'public_service',
    comment: '服务类型:administrative_license-行政许可 administrative_confirmation-行政确认 public_service-公共服务',
  })
  serviceType: ServiceType;

  @Column({
    name: 'handling_mode',
    type: 'varchar',
    length: 20,
    default: 'hybrid',
    comment: '办理方式:online-线上 offline-线下 hybrid-混合',
  })
  handlingMode: HandlingMode;

  @Column({ name: 'promise_days', type: 'int', default: 0, comment: '承诺办结天数' })
  promiseDays: number;

  @Column({ name: 'charge_standard', type: 'text', nullable: true, comment: '收费标准' })
  chargeStandard: string | null;

  @Column({ name: 'legal_basis', type: 'text', nullable: true, comment: '法定依据' })
  legalBasis: string | null;

  @Column({
    name: 'materials_required',
    type: 'jsonb',
    nullable: true,
    comment: '所需材料清单(JSON数组)',
  })
  materialsRequired: MaterialItem[] | null;

  @Column({ name: 'description', type: 'text', nullable: true, comment: '事项描述' })
  description: string | null;

  @Column({ name: 'accept_condition', type: 'text', nullable: true, comment: '受理条件' })
  acceptCondition: string | null;

  @Column({ name: 'handling_process', type: 'text', nullable: true, comment: '办理流程' })
  handlingProcess: string | null;

  @Column({ name: 'keywords', type: 'varchar', length: 500, nullable: true, comment: '搜索关键词(逗号分隔)' })
  keywords: string | null;

  @Column({ name: 'hot_level', type: 'int', default: 0, comment: '热度等级1-5, 0表示未设置' })
  hotLevel: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'published',
    comment: '状态:draft-草稿 published-已发布 offline-已下架',
  })
  status: string;

  @ManyToOne(() => ServiceCategory, (category) => category.items, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory | null;

  @OneToMany(() => ServiceSubitem, (subitem) => subitem.item)
  subitems: ServiceSubitem[];

  @OneToMany(() => ScenarioTree, (scenario) => scenario.item)
  scenarios: ScenarioTree[];

  @OneToMany(() => Application, (application) => application.item)
  applications: Application[];
}
