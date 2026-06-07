import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { QualityInspectionRecord } from './QualityInspectionRecord';

export enum InspectionTrigger {
  RANDOM = 'random',
  FIRST_ORDER = 'first_order',
  COMPLAINT = 'complaint',
  SCHEDULED = 'scheduled',
}

@Entity()
export class QualityInspectionRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: InspectionTrigger,
    default: InspectionTrigger.RANDOM,
  })
  trigger: InspectionTrigger;

  @Column({ type: 'simple-json' })
  checkItems: {
    id: string;
    name: string;
    description: string;
    required: boolean;
    scoreWeight: number;
  }[];

  @Column({ type: 'int', default: 100 })
  totalScore: number;

  @Column({ type: 'int', default: 60 })
  passingScore: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number;

  @Column({ type: 'int', default: 0 })
  samplingRate: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => QualityInspectionRecord, record => record.rule)
  records: QualityInspectionRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
