import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'
import type { GeoLocation } from '../../../shared/types/index.js'
import { Merchant } from './Merchant.js'
import { POSTerminal } from './POSTerminal.js'

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  merchantId: string

  @ManyToOne(() => Merchant, (merchant) => merchant.stores)
  merchant: Merchant

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string

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
    type: 'simple-json',
  })
  location: GeoLocation

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: 'active' | 'inactive'

  @OneToMany(() => POSTerminal, (terminal) => terminal.store)
  posTerminals: POSTerminal[]

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
