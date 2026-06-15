import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceItem } from './service-item.entity';
import { ServiceSubitem } from './service-subitem.entity';

export interface ScenarioOption {
  key: string;
  label: string;
  value: string;
  nextNodeId?: string;
  resultSubitemId?: string;
}

@Entity('sh_scenario_tree')
export class ScenarioTree extends BaseEntity {
  @Column({ name: 'item_id', type: 'uuid', comment: '所属事项ID' })
  @Index('idx_scenario_item_id')
  itemId: string;

  @Column({ name: 'parent_node_id', type: 'uuid', nullable: true, comment: '父节点ID' })
  @Index('idx_scenario_parent_id')
  parentNodeId: string | null;

  @Column({ name: 'node_code', type: 'varchar', length: 50, nullable: true, comment: '节点编码' })
  nodeCode: string | null;

  @Column({ name: 'question', type: 'text', comment: '问题内容' })
  question: string;

  @Column({ name: 'options', type: 'jsonb', nullable: true, comment: '选项列表(JSON数组)' })
  options: ScenarioOption[] | null;

  @Column({ name: 'next_node_id', type: 'uuid', nullable: true, comment: '默认下一节点ID' })
  nextNodeId: string | null;

  @Column({ name: 'result_subitem_id', type: 'uuid', nullable: true, comment: '结果子项ID' })
  @Index('idx_scenario_result_id')
  resultSubitemId: string | null;

  @Column({ name: 'sort', type: 'int', default: 0, comment: '排序号' })
  sort: number;

  @Column({ name: 'is_root', type: 'boolean', default: false, comment: '是否根节点' })
  isRoot: boolean;

  @Column({ name: 'is_leaf', type: 'boolean', default: false, comment: '是否叶子节点(结果节点)' })
  isLeaf: boolean;

  @ManyToOne(() => ServiceItem, (item) => item.scenarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: ServiceItem;

  @ManyToOne(() => ScenarioTree, (node) => node.children, { nullable: true })
  @JoinColumn({ name: 'parent_node_id' })
  parentNode: ScenarioTree | null;

  @OneToMany(() => ScenarioTree, (node) => node.parentNode)
  children: ScenarioTree[];

  @ManyToOne(() => ServiceSubitem, (subitem) => subitem.resultScenarios, { nullable: true })
  @JoinColumn({ name: 'result_subitem_id' })
  resultSubitem: ServiceSubitem | null;
}
