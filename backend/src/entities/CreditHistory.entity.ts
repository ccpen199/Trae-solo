import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RiderEntity } from './Rider.entity.js';

@Entity('credit_histories')
@Index(['riderId', 'createdAt'])
export class CreditHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'int' })
  change: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  operatorId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RiderEntity, (rider) => rider.creditHistories)
  @JoinColumn({ name: 'riderId' })
  rider: RiderEntity;
}
