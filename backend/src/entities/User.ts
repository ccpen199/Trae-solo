import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';

export type UserRole = 'admin' | 'operator' | 'checker' | 'tourist';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  username!: string;

  @Column()
  password!: string;

  @Column({ type: 'varchar', length: 50 })
  role!: UserRole;

  @Column({ nullable: true })
  realName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}