import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm'
import type { CouponType, CouponStatus } from '../../../shared/types/index.js'
import { CouponInstance } from './CouponInstance.js'
import { DistributionStrategy } from './DistributionStrategy.js'
import { Merchant } from './Merchant.js'
import { Inventory } from './Inventory.js'

@Entity('coupon_activities')
export class CouponActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string

  @Column({
    type: 'varchar',
    length: 20,
  })
  type: CouponType

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  value: number

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  threshold: number

  @Column({
    type: 'int',
  })
  totalQuantity: number

  @Column({
    type: 'int',
    default: 0,
  })
  usedQuantity: number

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: CouponStatus

  @Column({
    type: 'datetime',
  })
  startTime: Date

  @Column({
    type: 'datetime',
  })
  endTime: Date

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  strategyId: string | null

  @OneToOne(() => DistributionStrategy, (strategy) => strategy.couponActivity, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  distributionStrategy: DistributionStrategy | null

  @ManyToMany(() => Merchant)
  @JoinTable({
    name: 'coupon_activity_merchants',
    joinColumn: { name: 'activity_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'merchant_id', referencedColumnName: 'id' },
  })
  applicableMerchants: Merchant[]

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  applicableMerchantIds: string[] | null

  @OneToMany(() => CouponInstance, (instance) => instance.activity)
  couponInstances: CouponInstance[]

  @OneToMany(() => Inventory, (inventory) => inventory.activity)
  inventoryRecords: Inventory[]

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date
}
