import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { TimeSlot } from './TimeSlot';

@Entity()
@Index(['timeSlotId'], { unique: true })
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  timeSlotId!: string;

  @ManyToOne(() => TimeSlot, (slot) => slot.inventories)
  timeSlot!: TimeSlot;

  @Column({ type: 'int', default: 0 })
  total!: number;

  @Column({ type: 'int', default: 0 })
  available!: number;

  @Column({ type: 'int', default: 0 })
  locked!: number;

  @Column({ type: 'int', default: 0 })
  sold!: number;

  @Column({ type: 'int', default: 0 })
  refunded!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}