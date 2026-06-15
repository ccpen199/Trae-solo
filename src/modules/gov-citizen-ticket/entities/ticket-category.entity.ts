import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type CategoryType = 'complaint' | 'suggestion' | 'consultation' | 'assistance' | 'praise';

@Entity('gct_ticket_category')
export class TicketCategory extends BaseEntity {
  @Column({
    name: 'category_code',
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '分类编码',
  })
  @Index('idx_category_code', { unique: true })
  categoryCode: string;

  @Column({
    name: 'category_name',
    type: 'varchar',
    length: 100,
    comment: '分类名称',
  })
  categoryName: string;

  @Column({
    name: 'category_type',
    type: 'varchar',
    length: 20,
    comment: '大类类型: complaint-投诉 suggestion-建议 consultation-咨询 assistance-求助 praise-表扬',
  })
  categoryType: CategoryType;

  @Column({
    name: 'parent_id',
    type: 'uuid',
    nullable: true,
    comment: '父分类ID',
  })
  parentId: string | null;

  @Column({
    name: 'level',
    type: 'int',
    default: 1,
    comment: '层级',
  })
  level: number;

  @Column({
    name: 'sort',
    type: 'int',
    default: 0,
    comment: '排序',
  })
  sort: number;

  @Column({
    name: 'default_dept_code',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '默认处理部门编码',
  })
  defaultDeptCode: string | null;

  @Column({
    name: 'keywords',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '关键词(逗号分隔)',
  })
  keywords: string | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: '是否启用',
  })
  isActive: boolean;
}
