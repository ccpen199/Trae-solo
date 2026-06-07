import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { QualityInspectionRule } from './QualityInspectionRule';
import { Order } from './Order';
import { User } from './User';

export enum InspectionResult {
  PASS = 'pass',
  FAIL = 'fail',
  PENDING = 'pending',
}

@Entity()
export class QualityInspectionRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QualityInspectionRule, rule => rule.records)
  rule: QualityInspectionRule;

  @Column()
  ruleId: number;

  @ManyToOne(() => Order)
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => User)
  inspector: User;

  @Column()
  inspectorId: number;

  @ManyToOne(() => User)
  provider: User;

  @Column()
  providerId: number;

  @Column({ type: 'simple-json' })
  checkResults: {
    itemId: string;
    itemName: string;
    passed: boolean;
    score: number;
    notes: string;
    photoUrl?: string;
  }[];

  @Column({ type: 'int' })
  totalScore: number;

  @Column({
    type: 'simple-enum',
    enum: InspectionResult,
    default: InspectionResult.PENDING,
  })
  result: InspectionResult;

  @Column({ type: 'text', nullable: true })
  inspectorNotes: string;

  @Column({ type: 'simple-json', nullable: true })
  photos: string[];

  @Column({ type: 'datetime', nullable: true })
  inspectionTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
