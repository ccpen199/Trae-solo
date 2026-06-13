import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { SceneStatus, SceneTriggerType, SceneConditionOperator, SceneActionType } from '@iot/shared';

@Entity('scenes')
export class SceneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  homeId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ type: 'simple-json', default: '[]' })
  triggers: {
    id: string;
    type: SceneTriggerType;
    config: Record<string, any>;
  }[];

  @Column({ type: 'simple-json', default: '[]' })
  conditions: {
    id: string;
    field: string;
    operator: SceneConditionOperator;
    value: any;
    value2?: any;
  }[];

  @Column({ type: 'simple-json', default: '[]' })
  actions: {
    id: string;
    type: SceneActionType;
    order: number;
    delayMs?: number;
    config: Record<string, any>;
  }[];

  @Column({ type: 'simple-enum', enum: SceneStatus, default: SceneStatus.ENABLED })
  status: SceneStatus;

  @Column({ type: 'datetime', nullable: true })
  lastExecutedAt: Date;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ type: 'simple-json', nullable: true })
  learningData: {
    optimalTriggerTimes?: Record<string, number>;
    usageCount?: number;
    lastWeekStats?: any[];
  };

  @Index()
  @Column({ default: true })
  autoLearning: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
