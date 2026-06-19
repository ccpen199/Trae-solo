import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { CouponActivity } from './CouponActivity.js'

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  activityId: string

  @ManyToOne(() => CouponActivity, (activity) => activity.inventoryRecords)
  activity: CouponActivity

  @Column({
    type: 'varchar',
    length: 64,
  })
  batchNo: string

  @Column({
    type: 'int',
  })
  quantity: number

  @Column({
    type: 'int',
  })
  availableQuantity: number

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  unitCost: number | null

  @Column({
    type: 'date',
    nullable: true,
  })
  expiryDate: Date | null

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
