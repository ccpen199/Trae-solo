import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Role } from './Role.js';
import { UserRole } from '../types/common.js';
import { RetailStore } from './RetailStore.js';
import { Farmer } from './Farmer.js';
import { Expert } from './Expert.js';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  realName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  roleCode: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string | null;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @Column({ type: 'uuid', nullable: true })
  retailStoreId: string | null;

  @OneToMany(() => RetailStore, (retailStore) => retailStore.owner)
  ownedRetailStores: RetailStore[];

  @Column({ type: 'uuid', nullable: true })
  farmerId: string | null;

  @OneToMany(() => Farmer, (farmer) => farmer.user)
  farmerProfiles: Farmer[];

  @Column({ type: 'uuid', nullable: true })
  expertId: string | null;

  @OneToMany(() => Expert, (expert) => expert.user)
  expertProfiles: Expert[];
}
