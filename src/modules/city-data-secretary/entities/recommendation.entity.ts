import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type RecommendType = 'service_item' | 'cert' | 'policy';

@Entity('cds_recommendation')
export class Recommendation extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '用户ID' })
  @Index('idx_rec_user_id')
  userId: string;

  @Column({
    name: 'recommend_type',
    type: 'varchar',
    length: 30,
    comment: '推荐类型: service_item-服务事项 cert-证照提醒 policy-政策通知',
  })
  recommendType: RecommendType;

  @Column({
    name: 'target_id',
    type: 'varchar',
    length: 64,
    comment: '推荐目标ID',
  })
  targetId: string;

  @Column({
    name: 'target_title',
    type: 'varchar',
    length: 255,
    comment: '推荐目标标题',
  })
  targetTitle: string;

  @Column({
    name: 'score',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
    comment: '推荐评分(0-1)',
  })
  score: number;

  @Column({
    name: 'reason',
    type: 'text',
    nullable: true,
    comment: '推荐理由',
  })
  reason: string | null;

  @Column({
    name: 'extra_info',
    type: 'json',
    nullable: true,
    comment: '扩展信息(JSON)',
  })
  extraInfo: Record<string, any> | null;

  @Column({
    name: 'is_read',
    type: 'boolean',
    default: false,
    comment: '是否已读',
  })
  isRead: boolean;

  @Column({
    name: 'is_clicked',
    type: 'boolean',
    default: false,
    comment: '是否已点击',
  })
  isClicked: boolean;

  @Column({
    name: 'is_favorited',
    type: 'boolean',
    default: false,
    comment: '是否已收藏',
  })
  isFavorited: boolean;

  @Column({
    name: 'is_ignored',
    type: 'boolean',
    default: false,
    comment: '是否已忽略',
  })
  isIgnored: boolean;

  @Column({
    name: 'create_time',
    type: 'timestamp',
    comment: '推荐生成时间',
  })
  createTime: Date;
}
