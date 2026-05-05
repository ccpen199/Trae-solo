import { Entity, Column, ManyToOne, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';
import { Site } from '../../../common/entities/base.entity';

@Entity('site_permissions')
@Index(['siteId', 'roleId'], { unique: true, where: "role_id IS NOT NULL" })
@Index(['siteId', 'userId'], { unique: true, where: "user_id IS NOT NULL" })
export class SitePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'uuid', name: 'site_id' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  site: Site;

  @Column({ type: 'uuid', name: 'role_id', nullable: true })
  roleId: string;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'CASCADE' })
  role: Role;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'simple-json', default: '{}' })
  permissions: Record<string, boolean>;

  @Column({ type: 'boolean', default: false, name: 'is_manager' })
  isManager: boolean;
}
