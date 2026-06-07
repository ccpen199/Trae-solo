import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { User } from './User';

export enum LogType {
  STATUS_CHANGE = 'status_change',
  NOTE = 'note',
  PHOTO = 'photo',
  LOCATION = 'location',
}

@Entity()
export class OrderLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.logs)
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => User, { nullable: true })
  operator: User;

  @Column({ nullable: true })
  operatorId: number;

  @Column({
    type: 'simple-enum',
    enum: LogType,
    default: LogType.STATUS_CHANGE,
  })
  type: LogType;

  @Column()
  message: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
