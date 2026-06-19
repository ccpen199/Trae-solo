import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Store } from './Store.js'
import { VerificationRecord } from './VerificationRecord.js'
import { SettlementRecord } from './SettlementRecord.js'

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  licenseNo: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  contactName: string

  @Column({
    type: 'varchar',
    length: 11,
  })
  contactPhone: string

  @Column({
    type: 'varchar',
    length: 500,
  })
  address: string

  @Column({
    type: 'varchar',
    length: 50,
  })
  district: string

  @Column({
    type: 'varchar',
    length: 100,
  })
  category: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: 'active' | 'inactive' | 'pending'

  @OneToMany(() => Store, (store) => store.merchant)
  stores: Store[]

  @OneToMany(() => VerificationRecord, (record) => record.merchant)
  verificationRecords: VerificationRecord[]

  @OneToMany(() => SettlementRecord, (record) => record.merchant)
  settlementRecords: SettlementRecord[]

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
