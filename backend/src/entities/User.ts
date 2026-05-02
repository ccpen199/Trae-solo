import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export enum UserRole {
  FORWARDER = 'forwarder',
  AIRLINE = 'airline',
  WAREHOUSE = 'warehouse',
  SECURITY = 'security',
  CONSIGNEE = 'consignee',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  username!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'simple-enum', enum: UserRole })
  role!: UserRole;

  @Column({ name: 'company_name', type: 'varchar', nullable: true })
  companyName?: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
