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
import { RiderEntity } from './Rider.entity';

@Entity('credit_histories')
@Index(['riderId', 'createdAt'])
export class CreditHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  riderId: string;

  @Column({ type: 'int' })
  change: number;

  @Column({ length: 500 })
  reason: string;

  @Column({ length: 36, nullable: true })
  orderId?: string;

  @Column({ length: 36, nullable: true })
  operatorId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RiderEntity, (rider) => rider.creditHistories)
  @JoinColumn({ name: 'riderId' })
  rider: RiderEntity;
}
