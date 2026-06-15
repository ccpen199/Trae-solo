import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export interface SubRatings {
  responseSpeed: number;
  attitude: number;
  resolutionEffect: number;
  isPublic: boolean;
}

@Entity('gct_satisfaction_survey')
export class SatisfactionSurvey extends BaseEntity {
  @Column({
    name: 'ticket_id',
    type: 'uuid',
    unique: true,
    comment: '工单ID',
  })
  @Index('idx_ss_ticket_id', { unique: true })
  ticketId: string;

  @Column({
    name: 'rating',
    type: 'int',
    comment: '总体评分(1-5星)',
  })
  rating: number;

  @Column({
    name: 'sub_ratings',
    type: 'json',
    nullable: true,
    comment: '分项评分(JSON: 响应速度/处理态度/解决效果/是否公开)',
  })
  subRatings: SubRatings | null;

  @Column({
    name: 'comment',
    type: 'text',
    nullable: true,
    comment: '评价内容',
  })
  comment: string | null;

  @Column({
    name: 'is_public',
    type: 'boolean',
    default: false,
    comment: '是否公开评价',
  })
  isPublic: boolean;

  @Column({
    name: 'reply_content',
    type: 'text',
    nullable: true,
    comment: '官方回复内容',
  })
  replyContent: string | null;

  @Column({
    name: 'reply_time',
    type: 'timestamp',
    nullable: true,
    comment: '官方回复时间',
  })
  replyTime: Date | null;

  @Column({
    name: 'submitter_id',
    type: 'uuid',
    nullable: true,
    comment: '评价人ID',
  })
  submitterId: string | null;

  @Column({
    name: 'survey_time',
    type: 'timestamp',
    comment: '评价时间',
  })
  surveyTime: Date;
}
