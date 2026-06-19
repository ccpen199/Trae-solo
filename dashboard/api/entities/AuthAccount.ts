import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import type { UserRole } from '../../../shared/types/index.js'

@Entity('auth_accounts')
export class AuthAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
  })
  username: string

  @Column({
    type: 'varchar',
    length: 255,
  })
  password: string

  @Column({
    type: 'varchar',
    length: 64,
  })
  name: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'merchant',
  })
  role: UserRole

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  merchantId: string | null

  @Column({
    type: 'boolean',
    default: true,
  })
  active: boolean

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
