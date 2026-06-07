import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { User } from './User';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, order => order.reviews)
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => User, user => user.reviews)
  provider: User;

  @Column()
  providerId: number;

  @ManyToOne(() => User)
  customer: User;

  @Column()
  customerId: number;

  @Column('int')
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'simple-json', nullable: true })
  photos: string[];

  @Column({ default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
