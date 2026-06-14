import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type SensitiveWordCategory = 'salary_promise' | 'overtime_culture' | 'false_publicity' | 'other';

@Entity()
export class SensitiveWord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  word: string;

  @Column({
    type: 'text',
    default: 'other'
  })
  category: SensitiveWordCategory;

  @Column({ default: 'medium' })
  riskLevel: string;

  @Column({ nullable: true })
  replacement: string;

  @Column({ default: true })
  enabled: boolean;
}
