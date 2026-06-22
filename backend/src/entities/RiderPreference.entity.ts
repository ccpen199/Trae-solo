import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { RiderEntity } from './Rider.entity';

@Entity('rider_preferences')
export class RiderPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  riderId: string;

  @Column({ type: 'int', default: 5000 })
  maxDistance: number;

  @Column({ type: 'jsonb', default: ['delivery', 'pickup', 'errands', 'shopping'] })
  orderTypes: string[];

  @Column({
    type: 'jsonb',
    default: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '22:00' }],
  })
  workingHours: {
    start: string;
    end: string;
  }[];

  @Column({ default: false })
  autoAccept: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5 })
  minOrderAmount: number;

  @Column({ type: 'jsonb', default: [] })
  preferredAreas: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => RiderEntity, (rider) => rider.preference)
  @JoinColumn({ name: 'riderId' })
  rider: RiderEntity;
}
