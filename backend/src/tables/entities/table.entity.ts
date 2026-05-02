import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TableStatus, TableZone } from '../../common/types';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  tableNumber: string;

  @Column({ type: 'int', default: 4 })
  capacity: number;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.VACANT,
  })
  status: TableStatus;

  @Column({
    type: 'enum',
    enum: TableZone,
    default: TableZone.MAIN,
  })
  zone: TableZone;

  @Column({ length: 100, nullable: true })
  qrCodeUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  position: {
    x: number;
    y: number;
    floor: number;
  };

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Order', 'table')
  orders: any[];

  @Column({ type: 'uuid', nullable: true })
  currentOrderId: string;
}
