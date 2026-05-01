import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm'
import { Member } from './Member.entity'

export enum UserRole {
  MEMBER = 'member',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  FINANCE = 'finance',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  username: string

  @Column()
  password: string

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true, unique: true })
  phone: string

  @Column({ nullable: true, unique: true })
  email: string

  @Column({ default: true })
  isActive: boolean

  @OneToOne(() => Member, (member) => member.user)
  member: Member

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
