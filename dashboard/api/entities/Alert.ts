import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import type { AlertType, AlertLevel } from '../../../shared/types/index.js'

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'varchar',
    length: 30,
  })
  type: AlertType

  @Column({
    type: 'varchar',
    length: 20,
  })
  level: AlertLevel

  @Column({
    type: 'varchar',
    length: 255,
  })
  title: string

  @Column({
    type: 'text',
  })
  message: string

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  relatedId: string | null

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  merchantId: string | null

  @Column({
    type: 'boolean',
    default: false,
  })
  read: boolean

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date
}
