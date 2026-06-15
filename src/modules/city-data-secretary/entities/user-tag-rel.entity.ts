import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type TagSource = 'auto' | 'manual';

@Entity('cds_user_tag_rel')
export class UserTagRel extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '用户ID' })
  @Index('idx_utr_user_id')
  userId: string;

  @Column({ name: 'tag_id', type: 'uuid', comment: '标签ID' })
  @Index('idx_utr_tag_id')
  tagId: string;

  @Column({
    name: 'tag_value',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '标签值',
  })
  tagValue: string | null;

  @Column({
    name: 'tag_weight',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 1.0,
    comment: '标签权重(0-1)',
  })
  tagWeight: number;

  @Column({
    name: 'source',
    type: 'varchar',
    length: 10,
    default: 'auto',
    comment: '来源: auto-自动打标 manual-手动打标',
  })
  source: TagSource;

  @Column({
    name: 'expire_time',
    type: 'timestamp',
    nullable: true,
    comment: '标签过期时间',
  })
  expireTime: Date | null;
}
