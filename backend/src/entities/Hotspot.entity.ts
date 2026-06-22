import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coordinate } from '@shared/types';

@Entity('hotspots')
export class HotspotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'jsonb' })
  location: Coordinate;

  @Column({ type: 'float' })
  radius: number;

  @Column({ type: 'int', default: 0 })
  orderCount: number;

  @Column({ type: 'int', default: 0 })
  riderCount: number;

  @Column({ type: 'float', default: 0 })
  heatLevel: number;

  @Column({ type: 'jsonb', default: [] })
  peakHours: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
