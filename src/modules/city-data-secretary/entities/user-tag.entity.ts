import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type TagCategory = 'basic' | 'behavior' | 'preference';
export type TagValueType = 'string' | 'number' | 'boolean' | 'enum' | 'date';

@Entity('cds_user_tag')
export class UserTag extends BaseEntity {
  @Column({
    name: 'tag_code',
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '标签编码',
  })
  @Index('idx_tag_code', { unique: true })
  tagCode: string;

  @Column({
    name: 'tag_name',
    type: 'varchar',
    length: 100,
    comment: '标签名称',
  })
  tagName: string;

  @Column({
    name: 'tag_category',
    type: 'varchar',
    length: 20,
    comment: '标签分类: basic-基础属性 behavior-行为特征 preference-偏好特征',
  })
  tagCategory: TagCategory;

  @Column({
    name: 'tag_value_type',
    type: 'varchar',
    length: 20,
    comment: '标签值类型',
  })
  tagValueType: TagValueType;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: '标签描述',
  })
  description: string | null;

  @Column({
    name: 'auto_rule',
    type: 'text',
    nullable: true,
    comment: '自动打标签规则表达式',
  })
  autoRule: string | null;
}
