import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Role } from './Role.js';

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
}

export enum PermissionResource {
  PRODUCT = 'product',
  PRICE_POLICY = 'price_policy',
  INVENTORY = 'inventory',
  ORDER = 'order',
  CREDIT = 'credit',
  DISPUTE = 'dispute',
  USER = 'user',
  ROLE = 'role',
  WAREHOUSE = 'warehouse',
  RETAIL_STORE = 'retail_store',
  FARMER = 'farmer',
  EXPERT = 'expert',
  TRACEABILITY = 'traceability',
  REPORT = 'report',
}

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: PermissionResource,
  })
  resource: PermissionResource;

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action: PermissionAction;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
