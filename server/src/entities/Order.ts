import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { MerchantProduct } from './MerchantProduct';
import { Community } from './Community';

@Entity()
export class Order {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('text')
  productId: string;

  @Column('text')
  communityId: string;

  @Column('integer', { default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('text', { default: 'pending' })
  status: string;

  @Column('text', { nullable: true })
  address: string;

  @Column('text', { nullable: true })
  contactName: string;

  @Column('text', { nullable: true })
  contactPhone: string;

  @Column('text', { nullable: true })
  scheduledTime: string;

  @Column('text', { nullable: true })
  remark: string;

  @Column('text', { nullable: true })
  paidAt: string;

  @Column('text', { nullable: true })
  paidMethod: string;

  @Column('text', { nullable: true })
  fulfilledAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => MerchantProduct)
  @JoinColumn({ name: 'productId' })
  product: MerchantProduct;

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'communityId' })
  community: Community;
}
