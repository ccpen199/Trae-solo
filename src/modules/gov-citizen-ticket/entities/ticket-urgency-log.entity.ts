import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('gct_ticket_urgency_log')
export class TicketUrgencyLog extends BaseEntity {
  @Column({
    name: 'ticket_id',
    type: 'uuid',
    comment: '工单ID',
  })
  @Index('idx_tul_ticket_id')
  ticketId: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: true,
    comment: '催办人ID',
  })
  userId: string | null;

  @Column({
    name: 'urgency_reason',
    type: 'text',
    nullable: true,
    comment: '催办原因',
  })
  urgencyReason: string | null;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '联系电话(SM4加密)',
  })
  contactPhone: string | null;

  @Column({
    name: 'urgency_time',
    type: 'timestamp',
    comment: '催办时间',
  })
  urgencyTime: Date;
}
