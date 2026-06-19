import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'
import { Store } from './Store.js'
import { Merchant } from './Merchant.js'
import { VerificationRecord } from './VerificationRecord.js'

@Entity('pos_terminals')
export class POSTerminal {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  storeId: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  merchantId: string

  @ManyToOne(() => Store, (store) => store.posTerminals)
  store: Store

  @ManyToOne(() => Merchant)
  merchant: Merchant

  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
  })
  terminalNo: string

  @Column({
    type: 'varchar',
    length: 100,
  })
  model: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: 'active' | 'inactive' | 'maintenance'

  @Column({
    type: 'datetime',
    nullable: true,
  })
  lastHeartbeat: Date | null

  @OneToMany(() => VerificationRecord, (record) => record.terminal)
  verificationRecords: VerificationRecord[]

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
