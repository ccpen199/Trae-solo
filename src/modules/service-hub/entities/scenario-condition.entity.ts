import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceItem } from './service-item.entity';
import { ServiceSubitem } from './service-subitem.entity';

export type ConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'between' | 'regex';

export interface ConditionExpression {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logic?: 'AND' | 'OR';
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (ConditionExpression | ConditionGroup)[];
}

@Entity('sh_scenario_condition')
export class ScenarioCondition extends BaseEntity {
  @Column({ name: 'item_id', type: 'uuid', comment: '所属事项ID' })
  @Index('idx_cond_item_id')
  itemId: string;

  @Column({ name: 'subitem_id', type: 'uuid', comment: '匹配的子项ID' })
  @Index('idx_cond_subitem_id')
  subitemId: string;

  @Column({ name: 'name', type: 'varchar', length: 200, comment: '条件名称' })
  name: string;

  @Column({ name: 'expression', type: 'jsonb', comment: '条件表达式(JSON)' })
  expression: ConditionGroup;

  @Column({ name: 'priority', type: 'int', default: 0, comment: '匹配优先级，数字越大优先级越高' })
  priority: number;

  @Column({ name: 'description', type: 'text', nullable: true, comment: '条件描述' })
  description: string | null;

  @Column({ name: 'enabled', type: 'boolean', default: true, comment: '是否启用' })
  enabled: boolean;

  @ManyToOne(() => ServiceItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: ServiceItem;

  @ManyToOne(() => ServiceSubitem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subitem_id' })
  subitem: ServiceSubitem;
}
