import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { GeofenceType, Coordinate } from '@shared/types';

@Entity('geofences')
@Index(['type', 'isEnabled'])
export class GeofenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['service_area', 'restricted_area', 'hotspot', 'warehouse'],
    default: 'service_area',
  })
  type: GeofenceType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  coordinates: Coordinate[];

  @Column({ type: 'jsonb' })
  center: Coordinate;

  @Column({ type: 'float', nullable: true })
  radius?: number;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({ type: 'jsonb', nullable: true })
  properties?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
