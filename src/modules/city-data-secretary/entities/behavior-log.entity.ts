import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('cds_behavior_log')
export class BehaviorLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', comment: '用户ID' })
  @Index('idx_bl_user_id')
  userId: string;

  @Column({
    name: 'module',
    type: 'varchar',
    length: 50,
    comment: '模块名称',
  })
  module: string;

  @Column({
    name: 'action',
    type: 'varchar',
    length: 50,
    comment: '行为动作: view/click/search/submit/favorite/share',
  })
  action: string;

  @Column({
    name: 'target_type',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '目标类型: service_item/cert/policy/article',
  })
  targetType: string | null;

  @Column({
    name: 'target_id',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: '目标ID',
  })
  targetId: string | null;

  @Column({
    name: 'duration',
    type: 'int',
    nullable: true,
    comment: '停留时长(秒)',
  })
  duration: number | null;

  @Column({
    name: 'params_json',
    type: 'json',
    nullable: true,
    comment: '请求参数(JSON)',
  })
  paramsJson: Record<string, any> | null;

  @Column({
    name: 'create_time',
    type: 'timestamp',
    comment: '行为发生时间',
  })
  createTime: Date;
}
