import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Enterprise } from './Enterprise';

export type UserRole = 'admin' | 'enterprise';
export type UserStatus = 'pending' | 'approved' | 'rejected';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', length: 50, default: 'enterprise' })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  enterpriseId: string | null;

  @ManyToOne(() => Enterprise, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise: Enterprise | null;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: UserStatus;

  @Column({ nullable: true })
  realName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
