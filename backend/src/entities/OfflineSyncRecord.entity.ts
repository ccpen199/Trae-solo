import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('offline_sync_records')
@Index(['riderId', 'status', 'createdAt'])
@Index(['syncType', 'status'])
export class OfflineSyncRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  riderId: string;

  @Column({
    type: 'enum',
    enum: ['location', 'order_status', 'photo'],
  })
  syncType: 'location' | 'order_status' | 'photo';

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  syncedAt?: Date;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'synced', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'synced' | 'failed';

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
