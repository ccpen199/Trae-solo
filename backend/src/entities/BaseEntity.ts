import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true })
  updatedBy?: string;

  @Column({ name: 'is_archived', type: 'boolean', default: false })
  isArchived!: boolean;
}
