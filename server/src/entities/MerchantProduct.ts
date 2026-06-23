import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Community } from './Community';

@Entity()
export class MerchantProduct {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  merchantId: string;

  @Column('text')
  communityId: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  category: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('simple-json', { nullable: true })
  images: string[];

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('text', { default: 'active' })
  status: string;

  @Column('integer', { default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.merchantProducts)
  @JoinColumn({ name: 'merchantId' })
  merchant: User;

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'communityId' })
  community: Community;
}
