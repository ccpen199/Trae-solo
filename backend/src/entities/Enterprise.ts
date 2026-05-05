import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './User';

export type EnterpriseType = 'production' | 'logistics' | 'transfer' | 'receiver';

@Entity('enterprises')
export class Enterprise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  enterpriseCode: string;

  @Column()
  enterpriseName: string;

  @Column({ type: 'varchar', length: 50 })
  enterpriseType: EnterpriseType;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => User, user => user.enterprise)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
