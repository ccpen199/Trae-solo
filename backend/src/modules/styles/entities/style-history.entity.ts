import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Style } from './style.entity';
import { StyleStatus } from '../../../common/enums/style-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('style_histories')
export class StyleHistory extends BaseEntity {
  @Column({ name: 'style_id', type: 'uuid' })
  styleId: string;

  @ManyToOne(() => Style, (style) => style.histories)
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ name: 'operator_id', type: 'uuid', nullable: true })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({
    name: 'old_status',
    type: 'varchar', length: 50,
    nullable: true,
  })
  oldStatus: StyleStatus;

  @Column({
    name: 'new_status',
    type: 'varchar', length: 50,
  })
  newStatus: StyleStatus;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ name: 'action_description', type: 'text', nullable: true })
  actionDescription: string;

  @Column({ name: 'changed_fields', type: 'json', nullable: true })
  changedFields: { [key: string]: { old: any; new: any } };

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'attachment_urls', type: 'json', nullable: true })
  attachmentUrls: string[];
}
