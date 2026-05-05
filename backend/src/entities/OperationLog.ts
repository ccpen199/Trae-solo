import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type OperationType = 'create_logistics' | 'upload_logistics' | 'download_logistics' | 'update_profile' | 'approve_enterprise' | 'reject_enterprise' | 'delete_enterprise' | 'delete_log' | 'login' | 'logout';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  operationType: OperationType;

  @Column({ type: 'text' })
  operationDesc: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ nullable: true })
  username: string;

  @Column({ type: 'uuid', nullable: true })
  enterpriseId: string | null;

  @Column({ nullable: true })
  enterpriseCode: string;

  @Column({ nullable: true })
  enterpriseName: string;

  @Column({ type: 'text', nullable: true })
  requestParams: string;

  @Column({ type: 'text', nullable: true })
  requestUrl: string;

  @Column({ nullable: true })
  requestMethod: string;

  @Column({ type: 'text', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
