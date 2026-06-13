import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  PENDING = 'pending',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Index()
  @Column({ unique: true, length: 100, nullable: true })
  email: string;

  @Index()
  @Column({ unique: true, length: 20, nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'simple-enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  notificationSettings: Record<string, boolean>;

  @CreateDateColumn()
  createdAt: Date;
}
