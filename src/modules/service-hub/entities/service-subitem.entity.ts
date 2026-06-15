import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceItem } from './service-item.entity';
import { ScenarioTree } from './scenario-tree.entity';
import { Application } from './application.entity';

@Entity('sh_service_subitem')
export class ServiceSubitem extends BaseEntity {
  @Column({ name: 'item_id', type: 'uuid', comment: '所属事项ID' })
  @Index('idx_subitem_item_id')
  itemId: string;

  @Column({ name: 'name', type: 'varchar', length: 200, comment: '子项名称' })
  name: string;

  @Column({ name: 'code', type: 'varchar', length: 50, nullable: true, comment: '子项编码' })
  @Index('idx_subitem_code')
  code: string | null;

  @Column({ name: 'description', type: 'text', nullable: true, comment: '子项描述' })
  description: string | null;

  @Column({ name: 'conditions', type: 'jsonb', nullable: true, comment: '办理条件(JSON)' })
  conditions: Record<string, unknown> | null;

  @Column({ name: 'materials', type: 'jsonb', nullable: true, comment: '所需材料(JSON数组)' })
  materials: Record<string, unknown>[] | null;

  @Column({ name: 'processing_flow', type: 'text', nullable: true, comment: '处理流程说明' })
  processingFlow: string | null;

  @Column({ name: 'sort', type: 'int', default: 0, comment: '排序号' })
  sort: number;

  @ManyToOne(() => ServiceItem, (item) => item.subitems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: ServiceItem;

  @OneToMany(() => ScenarioTree, (scenario) => scenario.resultSubitem)
  resultScenarios: ScenarioTree[];

  @OneToMany(() => Application, (application) => application.subitem)
  applications: Application[];
}
