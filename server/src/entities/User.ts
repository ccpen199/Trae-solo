import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Community } from './Community';
import { Project } from './Project';
import { Bill } from './Bill';
import { WorkOrder } from './WorkOrder';
import { Post } from './Post';
import { Comment } from './Comment';
import { MerchantProduct } from './MerchantProduct';
import { Order } from './Order';
import { ActivityRegistration } from './ActivityRegistration';
import { Message } from './Message';

@Entity()
export class User {
  @PrimaryColumn('text')
  id: string;

  @Column('text', { unique: true })
  phone: string;

  @Column('text')
  password: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  avatar: string;

  @Column('text')
  role: string;

  @Column('text')
  communityId: string;

  @Column('text', { nullable: true })
  projectId: string;

  @Column('text', { nullable: true })
  address: string;

  @Column('simple-json', { nullable: true })
  merchantInfo: Record<string, any>;

  @Column('text', { default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Community, community => community.users)
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => Bill, bill => bill.user)
  bills: Bill[];

  @OneToMany(() => WorkOrder, wo => wo.user)
  workOrders: WorkOrder[];

  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @OneToMany(() => MerchantProduct, product => product.merchant)
  merchantProducts: MerchantProduct[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => ActivityRegistration, reg => reg.user)
  activityRegistrations: ActivityRegistration[];

  @OneToMany(() => Message, message => message.user)
  messages: Message[];
}
