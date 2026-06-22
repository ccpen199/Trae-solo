import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Coordinate } from '@shared/types';

@Entity('geofence_alerts')
@Index(['geofenceId', 'eventType', 'timestamp'])
@Index(['riderId', 'timestamp'])
export class GeofenceAlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  geofenceId: string;

  @Column({ length: 36 })
  riderId: string;

  @Column({
    type: 'enum',
    enum: ['enter', 'exit'],
  })
  eventType: 'enter' | 'exit';

  @Column({ type: 'jsonb' })
  location: Coordinate;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
