import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { OrderLogAction } from '../../common/types';

@Entity('order_logs')
export class OrderLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: OrderLogAction,
  })
  action: OrderLogAction;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  details: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  operatorId: string;

  @Column({ length: 50, nullable: true })
  operatorName: string;

  @Column({ length: 50, nullable: true })
  operatorRole: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Order', 'logs')
  order: any;

  @ManyToOne('User')
  operator: any;
}
