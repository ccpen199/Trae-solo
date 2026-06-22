import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DispatchMode, OrderType } from '@shared/types';

@Entity('dispatch_rules')
export class DispatchRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'jsonb' })
  conditions: {
    orderTypes?: OrderType[];
    minAmount?: number;
    maxDistance?: number;
    isUrgent?: boolean;
    timeRange?: {
      start: string;
      end: string;
    };
  };

  @Column({ type: 'jsonb' })
  actions: {
    dispatchMode: DispatchMode;
    riderFilter?: {
      minCreditScore?: number;
      vehicleTypes?: string[];
      maxCurrentTasks?: number;
    };
    notification: {
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
